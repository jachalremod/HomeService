alter table public.estimates
add column if not exists deleted_at timestamptz;

create index if not exists estimates_user_deleted_at_idx
on public.estimates (user_id, deleted_at);