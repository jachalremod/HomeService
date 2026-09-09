alter table public.payment_schedules
add column stripe_checkout_session_id text unique,
add column stripe_checkout_url text,
add column stripe_checkout_expires_at timestamptz;

alter table public.payments
add column provider text not null default 'manual',
add column stripe_checkout_session_id text unique,
add column stripe_payment_intent_id text unique;

create index payment_schedules_stripe_session_idx
on public.payment_schedules(stripe_checkout_session_id);

create index payments_stripe_payment_intent_idx
on public.payments(stripe_payment_intent_id);
