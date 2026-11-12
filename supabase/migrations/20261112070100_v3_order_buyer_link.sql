-- Link v3 orders to the verified buyer profile without altering order/payment states.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS buyer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_v3_buyer_profile_index
  ON public.orders (buyer_profile_id, created_at DESC);

-- Link only when the legacy phone identifies exactly one profile.
WITH unique_phone_matches AS (
  SELECT phone_number, MIN(id::text)::uuid AS profile_id
  FROM public.profiles
  WHERE phone_number IS NOT NULL
  GROUP BY phone_number
  HAVING COUNT(*) = 1
)
UPDATE public.orders AS orders
SET buyer_profile_id = matches.profile_id
FROM unique_phone_matches AS matches
WHERE orders.buyer_profile_id IS NULL
  AND orders.buyer_phone = matches.phone_number;
