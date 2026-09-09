alter table public.estimates
add column if not exists show_quantity boolean not null default false;

alter table public.estimates
add column if not exists show_rate boolean not null default false;