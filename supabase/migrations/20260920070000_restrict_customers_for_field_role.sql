drop policy if exists "Members manage company customers" on public.customers;

create policy "Non-field members manage company customers"
on public.customers for all
to authenticated
using (
  public.is_organization_member(organization_id)
  and public.current_member_role(organization_id) <> 'field'
)
with check (
  public.is_organization_member(organization_id)
  and public.current_member_role(organization_id) <> 'field'
);

create policy "Field members view customers on their assigned jobs"
on public.customers for select
to authenticated
using (
  public.current_member_role(organization_id) = 'field'
  and exists (
    select 1 from public.jobs
    where jobs.customer_id = customers.id
      and jobs.assigned_to = auth.uid()
  )
);