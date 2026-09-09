alter table public.organizations
  add column subscription_status text not null default 'trialing',
  add column trial_started_at timestamptz not null default now(),
  add column trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_current_period_end timestamptz,
  add column subscription_cancel_at_period_end boolean not null default false,
  add constraint organizations_subscription_status_check check (
    subscription_status in ('trialing', 'active', 'past_due', 'canceled')
  );

create unique index organizations_stripe_customer_id_key
on public.organizations(stripe_customer_id)
where stripe_customer_id is not null;

create unique index organizations_stripe_subscription_id_key
on public.organizations(stripe_subscription_id)
where stripe_subscription_id is not null;

-- Companies created before subscriptions were introduced remain active.
update public.organizations
set subscription_status = 'active';

