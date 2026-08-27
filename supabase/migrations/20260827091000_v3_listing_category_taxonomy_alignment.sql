-- Align V3 listing categories with the verified public MtaaMarket taxonomy.
-- No product data, RLS policy, browser write path, or moderation state changes.

insert into public.categories (name, slug, icon, description, sort_order, is_active)
values (
  'Solar & Energy',
  'solar-energy',
  'Sun',
  'Solar lighting, energy, and practical power products for Siaya buyers.',
  3,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  is_active = true;

alter table public.products
  drop constraint if exists products_v3_category_slug_check;

alter table public.products
  add constraint products_v3_category_slug_check
    check (category_slug in (
      'home-kitchen',
      'phones-electronics',
      'solar-energy',
      'fashion',
      'groceries-pantry',
      'beauty-personal-care',
      'baby-kids',
      'farm-garden',
      'poultry-livestock',
      'building-tools',
      'school-office',
      'auto-motorbike'
    ));
