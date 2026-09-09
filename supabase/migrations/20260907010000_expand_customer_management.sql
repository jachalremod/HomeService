alter table public.customers
  add column if not exists title text,
  add column if not exists company_name text,
  add column if not exists lead_source text,
  add column if not exists communication_email boolean not null default true,
  add column if not exists communication_phone boolean not null default true,
  add column if not exists communication_sms boolean not null default false;

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  title text,
  first_name text not null,
  last_name text not null default '',
  company_name text,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Property',
  street_1 text not null,
  street_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'United States',
  tax_rate numeric(5,2),
  property_details text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_tax_rate_check
    check (tax_rate is null or (tax_rate >= 0 and tax_rate <= 100))
);

create table public.customer_address_contacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  address_id uuid not null references public.customer_addresses(id) on delete cascade,
  contact_id uuid not null references public.customer_contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (address_id, contact_id)
);

create index customer_contacts_customer_id_idx on public.customer_contacts(customer_id);
create index customer_addresses_customer_id_idx on public.customer_addresses(customer_id);
create unique index customer_addresses_one_primary_idx
  on public.customer_addresses(customer_id) where is_primary;
create index customer_address_contacts_contact_id_idx on public.customer_address_contacts(contact_id);

create trigger customer_contacts_set_updated_at
before update on public.customer_contacts
for each row execute function public.set_updated_at();

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

alter table public.customer_contacts enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_address_contacts enable row level security;

create policy "Users manage their customer contacts"
on public.customer_contacts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their customer addresses"
on public.customer_addresses for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their property contacts"
on public.customer_address_contacts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Keep existing customers useful in the new address editor.
insert into public.customer_addresses (
  user_id, customer_id, label, street_1, city, state, postal_code, country, is_primary
)
select
  user_id,
  id,
  'Primary property',
  project_address,
  coalesce(city, ''),
  coalesce(state, ''),
  coalesce(postal_code, ''),
  'United States',
  true
from public.customers
where project_address is not null
  and btrim(project_address) <> ''
  and not exists (
    select 1 from public.customer_addresses a where a.customer_id = customers.id
  );
