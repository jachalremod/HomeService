create type public.work_order_status as enum (
  'draft',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

alter table public.document_counters
drop constraint if exists document_counters_document_type_check;

alter table public.document_counters
add constraint document_counters_document_type_check
check (
  document_type in (
    'estimate',
    'invoice',
    'work_order'
  )
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  work_order_number text not null,
  title text not null,
  description text,
  instructions text,
  assigned_to text,
  status public.work_order_status not null default 'draft',
  scheduled_start date,
  scheduled_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_order_number)
);

create index work_orders_user_id_idx
on public.work_orders(user_id);

create index work_orders_customer_id_idx
on public.work_orders(customer_id);

create index work_orders_estimate_id_idx
on public.work_orders(estimate_id);

create trigger work_orders_set_updated_at
before update on public.work_orders
for each row execute function public.set_updated_at();

alter table public.work_orders enable row level security;

create policy "Users manage their work orders"
on public.work_orders
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.next_document_number(
  p_document_type text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  allocated_number bigint;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_document_type not in (
    'estimate',
    'invoice',
    'work_order'
  ) then
    raise exception 'Invalid document type';
  end if;

  insert into public.document_counters (
    user_id,
    document_type,
    next_number
  )
  values (
    current_user_id,
    p_document_type,
    1
  )
  on conflict (user_id, document_type)
  do update
  set next_number =
    public.document_counters.next_number + 1
  returning next_number - 1 into allocated_number;

  return allocated_number;
end;
$$;

revoke all
on function public.next_document_number(text)
from public;

grant execute
on function public.next_document_number(text)
to authenticated;