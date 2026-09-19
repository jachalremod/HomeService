create table public.user_signatures (
  user_id uuid primary key references auth.users(id) on delete cascade,
  signature_data text not null,
  signature_mode text not null check (signature_mode in ('draw', 'type')),
  typed_name text,
  updated_at timestamptz not null default now()
);

alter table public.user_signatures enable row level security;

create policy "Users manage their own signature"
on public.user_signatures for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);