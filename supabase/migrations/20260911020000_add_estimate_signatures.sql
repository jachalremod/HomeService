alter table public.estimates
add column customer_signature text,
add column customer_signed_at timestamptz,
add column customer_signed_name text,
add column company_signature text,
add column company_signed_at timestamptz;