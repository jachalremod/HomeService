-- Make organization_id optional in generated Supabase Insert types.
-- assign_row_organization() remains the fallback for privileged/background
-- inserts where auth.uid() is unavailable and user_id must determine ownership.

alter table public.business_profiles alter column organization_id set default public.current_organization_id();
alter table public.customers alter column organization_id set default public.current_organization_id();
alter table public.customer_contacts alter column organization_id set default public.current_organization_id();
alter table public.customer_addresses alter column organization_id set default public.current_organization_id();
alter table public.customer_address_contacts alter column organization_id set default public.current_organization_id();
alter table public.estimates alter column organization_id set default public.current_organization_id();
alter table public.estimate_items alter column organization_id set default public.current_organization_id();
alter table public.invoices alter column organization_id set default public.current_organization_id();
alter table public.payment_schedules alter column organization_id set default public.current_organization_id();
alter table public.payments alter column organization_id set default public.current_organization_id();
alter table public.jobs alter column organization_id set default public.current_organization_id();
alter table public.work_orders alter column organization_id set default public.current_organization_id();
alter table public.document_counters alter column organization_id set default public.current_organization_id();

