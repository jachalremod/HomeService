create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_.]{3,30}$')
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

create policy "Users manage their own profile"
on public.profiles for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Lets the login page resolve a username to its email before signing in.
-- Callable by anyone (anon), since login happens before authentication.
create or replace function public.get_email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select au.email
  from public.profiles as p
  join auth.users as au on au.id = p.user_id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;