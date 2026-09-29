alter table public.business_profiles
add column pass_processing_fee_to_customer boolean not null default false,
add column processing_fee_percentage numeric(5,2) not null default 3.00;