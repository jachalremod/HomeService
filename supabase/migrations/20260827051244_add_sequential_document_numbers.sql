create table public.document_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (
    document_type in ('estimate', 'invoice')
  ),
  next_number bigint not null default 0 check (next_number >= 0),
  primary key (user_id, document_type)
);

alter table public.document_counters enable row level security;

create policy "Users view their document counters"
on public.document_counters
for select
to authenticated
using ((select auth.uid()) = user_id);

with numbered_estimates as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at, id
    ) - 1 as sequential_number
  from public.estimates
)
update public.estimates
set estimate_number =
  numbered_estimates.sequential_number::text
from numbered_estimates
where public.estimates.id = numbered_estimates.id;

with numbered_invoices as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at, id
    ) - 1 as sequential_number
  from public.invoices
)
update public.invoices
set invoice_number =
  numbered_invoices.sequential_number::text
from numbered_invoices
where public.invoices.id = numbered_invoices.id;

insert into public.document_counters (
  user_id,
  document_type,
  next_number
)
select
  user_id,
  'estimate',
  count(*)
from public.estimates
group by user_id;

insert into public.document_counters (
  user_id,
  document_type,
  next_number
)
select
  user_id,
  'invoice',
  count(*)
from public.invoices
group by user_id;

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

  if p_document_type not in ('estimate', 'invoice') then
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
