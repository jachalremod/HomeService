alter table public.organizations
add column onboarding_completed boolean not null default false;

-- Existing companies were already configured before onboarding was introduced.
update public.organizations
set onboarding_completed = true;

comment on column public.organizations.onboarding_completed is
  'True after the contractor finishes the initial company setup flow.';

