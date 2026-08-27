-- MtaaMarket V3 approved-vendor listing metadata.
-- Apply only to isolated project mfgjpjtlmfdtsnkoluco after confirming the
-- current V3 products table. This does not alter RLS or add browser write paths.

alter table public.products
  add column category_slug text not null,
  add column stock_quantity integer not null;

alter table public.products
  add constraint products_v3_category_slug_check
    check (category_slug in (
      'phones-electronics',
      'computing',
      'home-kitchen',
      'fashion-accessories',
      'beauty-personal-care',
      'groceries-household',
      'baby-kids-toys',
      'farm-garden',
      'poultry-livestock',
      'tools-building',
      'automotive-parts'
    )),
  add constraint products_v3_stock_quantity_check
    check (stock_quantity >= 0);

create index products_v3_public_category_active_index
  on public.products (status, category_slug, created_at desc);
