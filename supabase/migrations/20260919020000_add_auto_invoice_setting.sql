alter table public.business_profiles
add column auto_generate_invoice_on_approval boolean not null default false;
