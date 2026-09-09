alter table public.customers
  add column if not exists billing_same_as_property boolean not null default true,
  add column if not exists billing_street_2 text,
  add column if not exists billing_city text,
  add column if not exists billing_state text,
  add column if not exists billing_postal_code text,
  add column if not exists billing_country text not null default 'United States';

update public.customers
set
  billing_address = coalesce(billing_address, project_address),
  billing_city = coalesce(billing_city, city),
  billing_state = coalesce(billing_state, state),
  billing_postal_code = coalesce(billing_postal_code, postal_code)
where billing_same_as_property;
