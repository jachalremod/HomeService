alter table public.estimates
  add column if not exists public_token uuid not null default gen_random_uuid();

create unique index if not exists estimates_public_token_idx
  on public.estimates(public_token);
