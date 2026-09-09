alter table public.business_profiles
add column if not exists estimate_contract_template text;

comment on column public.business_profiles.estimate_contract_template is
  'Default contract copied into each newly created estimate.';
