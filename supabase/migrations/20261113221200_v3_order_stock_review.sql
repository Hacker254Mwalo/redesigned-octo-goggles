-- Buyer orders begin as a placed order awaiting the owner's real availability check.
-- Existing records predate this workflow and remain treated as confirmed.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1
    CHECK (quantity BETWEEN 1 AND 100000),
  ADD COLUMN IF NOT EXISTS stock_review_status text NOT NULL DEFAULT 'confirmed'
    CHECK (stock_review_status IN ('pending', 'confirmed', 'unavailable')),
  ADD COLUMN IF NOT EXISTS stock_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_v3_stock_review_queue
  ON public.orders (stock_review_status, created_at DESC);

-- Called only by the server after it verifies the persisted founder role.
-- Row locks make approval and inventory reservation atomic, preventing two
-- concurrent owner actions from reserving the same units.
CREATE OR REPLACE FUNCTION public.review_v3_order_stock(
  p_order_id uuid,
  p_decision text,
  p_mark_listing_out_of_stock boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_product public.products%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('confirmed', 'unavailable') THEN
    RAISE EXCEPTION 'Invalid availability decision';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.stock_review_status <> 'pending' THEN
    RAISE EXCEPTION 'Order has already been reviewed';
  END IF;

  IF p_decision = 'confirmed' THEN
    IF v_order.product_id IS NULL THEN
      RAISE EXCEPTION 'The product listing is no longer available';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_order.product_id
    FOR UPDATE;

    IF NOT FOUND OR v_product.status <> 'ACTIVE'
       OR v_product.stock_quantity < v_order.quantity THEN
      RAISE EXCEPTION 'Insufficient current stock; mark unavailable or update the verified listing quantity first';
    END IF;

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_order.quantity
    WHERE id = v_order.product_id;

    UPDATE public.orders
    SET stock_review_status = 'confirmed',
        stock_reviewed_at = now()
    WHERE id = p_order_id;
  ELSE
    IF p_mark_listing_out_of_stock AND v_order.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = 0
      WHERE id = v_order.product_id;
    END IF;

    UPDATE public.orders
    SET stock_review_status = 'unavailable',
        order_status = 'CANCELLED',
        stock_reviewed_at = now()
    WHERE id = p_order_id;
  END IF;

  RETURN jsonb_build_object('id', p_order_id, 'stock_review_status', p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.review_v3_order_stock(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_v3_order_stock(uuid, text, boolean) TO service_role;


-- Serialize fulfillment transitions too; release a new stock reservation if
-- the owner cancels an order before it is handed over.
CREATE OR REPLACE FUNCTION public.transition_v3_order_fulfillment(
  p_order_id uuid,
  p_next_status text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_next_status NOT IN ('RECEIVED_AT_HUB', 'COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid fulfillment status';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.stock_review_status <> 'confirmed' THEN
    RAISE EXCEPTION 'Confirm item availability before fulfillment';
  END IF;

  IF NOT (
    (v_order.order_status = 'PENDING_DROPOFF' AND p_next_status IN ('RECEIVED_AT_HUB', 'CANCELLED')) OR
    (v_order.order_status = 'RECEIVED_AT_HUB' AND p_next_status IN ('COMPLETED', 'CANCELLED'))
  ) THEN
    RAISE EXCEPTION 'Invalid fulfillment transition';
  END IF;

  IF p_next_status = 'CANCELLED' AND v_order.stock_reviewed_at IS NOT NULL AND v_order.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_quantity = stock_quantity + v_order.quantity
    WHERE id = v_order.product_id;
  END IF;

  UPDATE public.orders
  SET order_status = p_next_status
  WHERE id = p_order_id;
  RETURN jsonb_build_object('id', p_order_id, 'order_status', p_next_status);
END;
$$;

REVOKE ALL ON FUNCTION public.transition_v3_order_fulfillment(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_v3_order_fulfillment(uuid, text) TO service_role;
