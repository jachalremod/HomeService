-- ServiceAxiom multi-company database foundation.
-- Preserves user_id for audit/backward compatibility while moving access control
-- and document numbering to organization_id.

create type public.organization_role as enum (
  'owner',
  'admin',
  'office',
  'field'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (nullif(btrim(name), '') is not null),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'field',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
on public.organization_members(user_id);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

-- Create one organization for every existing ServiceAxiom account.
insert into public.organizations (name, slug, created_by)
select
  coalesce(nullif(btrim(bp.company_name), ''), 'ServiceAxiom Contractor'),
  'company-' || replace(u.id::text, '-', ''),
  u.id
from auth.users as u
left join public.business_profiles as bp on bp.user_id = u.id
where not exists (
  select 1
  from public.organization_members as existing_member
  where existing_member.user_id = u.id
);

insert into public.organization_members (organization_id, user_id, role)
select o.id, o.created_by, 'owner'::public.organization_role
from public.organizations as o
where o.created_by is not null
on conflict (organization_id, user_id) do nothing;

create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as member
    where member.organization_id = p_organization_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.is_organization_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as member
    where member.organization_id = p_organization_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'admin')
  );
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select member.organization_id
  from public.organization_members as member
  where member.user_id = auth.uid()
  order by member.created_at, member.organization_id
  limit 1;
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
revoke all on function public.current_organization_id() from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.current_organization_id() to authenticated;

-- Add organization ownership to every business table.
alter table public.business_profiles add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.customers add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.customer_contacts add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.customer_addresses add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.customer_address_contacts add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.estimates add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.estimate_items add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.invoices add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.payment_schedules add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.payments add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.jobs add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.work_orders add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.document_counters add column organization_id uuid references public.organizations(id) on delete cascade;

-- Backfill the organization for all existing data.
update public.business_profiles as target
set organization_id = member.organization_id
from public.organization_members as member
where member.user_id = target.user_id;

update public.customers as target
set organization_id = member.organization_id
from public.organization_members as member
where member.user_id = target.user_id;

update public.customer_contacts as target
set organization_id = customer.organization_id
from public.customers as customer
where customer.id = target.customer_id;

update public.customer_addresses as target
set organization_id = customer.organization_id
from public.customers as customer
where customer.id = target.customer_id;

update public.customer_address_contacts as target
set organization_id = address.organization_id
from public.customer_addresses as address
where address.id = target.address_id;

update public.estimates as target
set organization_id = customer.organization_id
from public.customers as customer
where customer.id = target.customer_id;

update public.estimate_items as target
set organization_id = estimate.organization_id
from public.estimates as estimate
where estimate.id = target.estimate_id;

update public.invoices as target
set organization_id = estimate.organization_id
from public.estimates as estimate
where estimate.id = target.estimate_id;

update public.payment_schedules as target
set organization_id = invoice.organization_id
from public.invoices as invoice
where invoice.id = target.invoice_id;

update public.payments as target
set organization_id = invoice.organization_id
from public.invoices as invoice
where invoice.id = target.invoice_id;

update public.jobs as target
set organization_id = estimate.organization_id
from public.estimates as estimate
where estimate.id = target.estimate_id;

update public.work_orders as target
set organization_id = estimate.organization_id
from public.estimates as estimate
where estimate.id = target.estimate_id;

update public.document_counters as target
set organization_id = member.organization_id
from public.organization_members as member
where member.user_id = target.user_id;

alter table public.business_profiles alter column organization_id set not null;
alter table public.customers alter column organization_id set not null;
alter table public.customer_contacts alter column organization_id set not null;
alter table public.customer_addresses alter column organization_id set not null;
alter table public.customer_address_contacts alter column organization_id set not null;
alter table public.estimates alter column organization_id set not null;
alter table public.estimate_items alter column organization_id set not null;
alter table public.invoices alter column organization_id set not null;
alter table public.payment_schedules alter column organization_id set not null;
alter table public.payments alter column organization_id set not null;
alter table public.jobs alter column organization_id set not null;
alter table public.work_orders alter column organization_id set not null;
alter table public.document_counters alter column organization_id set not null;

-- Automatically derive organization_id for current application inserts.
create or replace function public.assign_row_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id is null then
    select member.organization_id
    into new.organization_id
    from public.organization_members as member
    where member.user_id = coalesce(auth.uid(), new.user_id)
    order by member.created_at, member.organization_id
    limit 1;
  end if;

  if new.organization_id is null then
    raise exception 'No organization membership found for this user';
  end if;

  return new;
end;
$$;

revoke all on function public.assign_row_organization() from public;

create trigger business_profiles_assign_organization before insert on public.business_profiles for each row execute function public.assign_row_organization();
create trigger customers_assign_organization before insert on public.customers for each row execute function public.assign_row_organization();
create trigger customer_contacts_assign_organization before insert on public.customer_contacts for each row execute function public.assign_row_organization();
create trigger customer_addresses_assign_organization before insert on public.customer_addresses for each row execute function public.assign_row_organization();
create trigger customer_address_contacts_assign_organization before insert on public.customer_address_contacts for each row execute function public.assign_row_organization();
create trigger estimates_assign_organization before insert on public.estimates for each row execute function public.assign_row_organization();
create trigger estimate_items_assign_organization before insert on public.estimate_items for each row execute function public.assign_row_organization();
create trigger invoices_assign_organization before insert on public.invoices for each row execute function public.assign_row_organization();
create trigger payment_schedules_assign_organization before insert on public.payment_schedules for each row execute function public.assign_row_organization();
create trigger payments_assign_organization before insert on public.payments for each row execute function public.assign_row_organization();
create trigger jobs_assign_organization before insert on public.jobs for each row execute function public.assign_row_organization();
create trigger work_orders_assign_organization before insert on public.work_orders for each row execute function public.assign_row_organization();
create trigger document_counters_assign_organization before insert on public.document_counters for each row execute function public.assign_row_organization();

create unique index business_profiles_organization_id_key on public.business_profiles(organization_id);
create index customers_organization_id_idx on public.customers(organization_id);
create index customer_contacts_organization_id_idx on public.customer_contacts(organization_id);
create index customer_addresses_organization_id_idx on public.customer_addresses(organization_id);
create index customer_address_contacts_organization_id_idx on public.customer_address_contacts(organization_id);
create index estimates_organization_id_idx on public.estimates(organization_id);
create index estimate_items_organization_id_idx on public.estimate_items(organization_id);
create index invoices_organization_id_idx on public.invoices(organization_id);
create index payment_schedules_organization_id_idx on public.payment_schedules(organization_id);
create index payments_organization_id_idx on public.payments(organization_id);
create index jobs_organization_id_idx on public.jobs(organization_id);
create index work_orders_organization_id_idx on public.work_orders(organization_id);

-- Number documents independently within each company.
alter table public.estimates drop constraint if exists estimates_user_id_estimate_number_key;
alter table public.estimates add constraint estimates_organization_number_key unique (organization_id, estimate_number);
alter table public.invoices drop constraint if exists invoices_user_id_invoice_number_key;
alter table public.invoices add constraint invoices_organization_number_key unique (organization_id, invoice_number);
alter table public.jobs drop constraint if exists jobs_user_id_job_number_key;
alter table public.jobs add constraint jobs_organization_number_key unique (organization_id, job_number);
alter table public.work_orders drop constraint if exists work_orders_user_id_work_order_number_key;
alter table public.work_orders add constraint work_orders_organization_number_key unique (organization_id, work_order_number);

alter table public.document_counters drop constraint document_counters_pkey;
alter table public.document_counters add primary key (organization_id, document_type);

create or replace function public.next_document_number(p_document_type text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_org_id uuid;
  allocated_number bigint;
begin
  current_user_id := auth.uid();
  current_org_id := public.current_organization_id();

  if current_user_id is null or current_org_id is null then
    raise exception 'Authentication and organization membership required';
  end if;

  if p_document_type not in ('estimate', 'invoice', 'work_order') then
    raise exception 'Invalid document type';
  end if;

  insert into public.document_counters (
    user_id,
    organization_id,
    document_type,
    next_number
  )
  values (current_user_id, current_org_id, p_document_type, 1)
  on conflict (organization_id, document_type)
  do update set next_number = public.document_counters.next_number + 1
  returning next_number - 1 into allocated_number;

  return allocated_number;
end;
$$;

revoke all on function public.next_document_number(text) from public;
grant execute on function public.next_document_number(text) to authenticated;

-- Replace user-only RLS with organization membership isolation.
drop policy if exists "Users manage their business profile" on public.business_profiles;
drop policy if exists "Users manage their customers" on public.customers;
drop policy if exists "Users manage their customer contacts" on public.customer_contacts;
drop policy if exists "Users manage their customer addresses" on public.customer_addresses;
drop policy if exists "Users manage their property contacts" on public.customer_address_contacts;
drop policy if exists "Users manage their estimates" on public.estimates;
drop policy if exists "Users manage their estimate items" on public.estimate_items;
drop policy if exists "Users manage their invoices" on public.invoices;
drop policy if exists "Users manage their payment schedules" on public.payment_schedules;
drop policy if exists "Users manage their payments" on public.payments;
drop policy if exists "Users manage their jobs" on public.jobs;
drop policy if exists "Users manage their work orders" on public.work_orders;
drop policy if exists "Users view their document counters" on public.document_counters;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Members view their organizations" on public.organizations for select to authenticated
using (public.is_organization_member(id));
create policy "Admins update their organizations" on public.organizations for update to authenticated
using (public.is_organization_admin(id)) with check (public.is_organization_admin(id));

create policy "Members view company memberships" on public.organization_members for select to authenticated
using (public.is_organization_member(organization_id));
create policy "Admins add company memberships" on public.organization_members for insert to authenticated
with check (public.is_organization_admin(organization_id));
create policy "Admins update company memberships" on public.organization_members for update to authenticated
using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "Admins remove company memberships" on public.organization_members for delete to authenticated
using (public.is_organization_admin(organization_id) and user_id <> auth.uid());

create policy "Members manage their business profile" on public.business_profiles for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company customers" on public.customers for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company customer contacts" on public.customer_contacts for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company customer addresses" on public.customer_addresses for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company property contacts" on public.customer_address_contacts for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company estimates" on public.estimates for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company estimate items" on public.estimate_items for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company invoices" on public.invoices for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company payment schedules" on public.payment_schedules for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company payments" on public.payments for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company jobs" on public.jobs for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members manage company work orders" on public.work_orders for all to authenticated
using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "Members view company document counters" on public.document_counters for select to authenticated
using (public.is_organization_member(organization_id));

-- Automatically create a company workspace for every future signup.
create or replace function public.handle_new_serviceaxiom_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
  company_name text;
begin
  company_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''),
    'ServiceAxiom Contractor'
  );

  insert into public.organizations (name, slug, created_by)
  values (company_name, 'company-' || replace(new.id::text, '-', ''), new.id)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, new.id, 'owner');

  insert into public.business_profiles (user_id, organization_id, company_name, owner_name, email)
  values (
    new.id,
    new_organization_id,
    company_name,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_serviceaxiom on auth.users;
create trigger on_auth_user_created_serviceaxiom
after insert on auth.users
for each row execute function public.handle_new_serviceaxiom_user();

comment on table public.organizations is 'Contractor companies using ServiceAxiom.';
comment on table public.organization_members is 'Users and their roles inside contractor companies.';
comment on column public.business_profiles.user_id is 'Legacy creator reference retained during the multi-company transition.';
