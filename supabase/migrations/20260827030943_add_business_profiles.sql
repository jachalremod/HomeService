create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null default 'ServiceAxiom Contractor',
  owner_name text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  postal_code text,
  license_number text,
  logo_url text,
  default_terms text,
  payment_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger business_profiles_set_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

alter table public.business_profiles enable row level security;

create policy "Users manage their business profile"
on public.business_profiles for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index business_profiles_user_id_idx
on public.business_profiles(user_id);
