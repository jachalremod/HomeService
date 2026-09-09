create extension if not exists pgcrypto;

create type public.estimate_status as enum (
  'draft',
  'sent',
  'approved',
  'declined'
);

create type public.invoice_status as enum (
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

create type public.schedule_status as enum (
  'upcoming',
  'due',
  'partially_paid',
  'paid',
  'overdue'
);

create type public.job_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  billing_address text,
  project_address text,
  city text,
  state text,
  postal_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  estimate_number text not null,
  title text not null,
  description text,
  status public.estimate_status not null default 'draft',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  approved_at timestamptz,
  expires_at date,
  notes text,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, estimate_number)
);

create table public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  estimate_id uuid not null unique references public.estimates(id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  issued_at timestamptz,
  notes text,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  title text not null,
  sequence integer not null check (sequence > 0),
  percentage numeric(7,4) check (
    percentage is null or percentage between 0 and 100
  ),
  amount numeric(12,2) not null check (amount > 0),
  due_date date,
  due_event text,
  status public.schedule_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_id, sequence)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  payment_schedule_id uuid references public.payment_schedules(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  reference_number text,
  notes text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  estimate_id uuid not null unique references public.estimates(id) on delete restrict,
  invoice_id uuid not null unique references public.invoices(id) on delete restrict,
  job_number text not null,
  title text not null,
  description text,
  status public.job_status not null default 'scheduled',
  scheduled_start date,
  scheduled_end date,
  actual_start date,
  actual_end date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_number)
);

create index customers_user_id_idx on public.customers(user_id);
create index estimates_user_id_idx on public.estimates(user_id);
create index estimates_customer_id_idx on public.estimates(customer_id);
create index estimate_items_estimate_id_idx on public.estimate_items(estimate_id);
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_customer_id_idx on public.invoices(customer_id);
create index payment_schedules_invoice_id_idx on public.payment_schedules(invoice_id);
create index payments_invoice_id_idx on public.payments(invoice_id);
create index jobs_user_id_idx on public.jobs(user_id);
create index jobs_customer_id_idx on public.jobs(customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger estimates_set_updated_at
before update on public.estimates
for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger payment_schedules_set_updated_at
before update on public.payment_schedules
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_schedules enable row level security;
alter table public.payments enable row level security;
alter table public.jobs enable row level security;

create policy "Users manage their customers"
on public.customers for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their estimates"
on public.estimates for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their estimate items"
on public.estimate_items for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their invoices"
on public.invoices for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their payment schedules"
on public.payment_schedules for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their payments"
on public.payments for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their jobs"
on public.jobs for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
