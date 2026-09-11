alter table public.estimates
add column payment_schedule jsonb;

comment on column public.estimates.payment_schedule is
  'Array of {title, percentage, dueEvent} objects defining how payment will be split once invoiced.';