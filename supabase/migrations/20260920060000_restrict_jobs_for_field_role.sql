drop policy if exists "Members manage company jobs" on public.jobs;

create policy "Non-field members manage company jobs"
on public.jobs for all
to authenticated
using (
  public.is_organization_member(organization_id)
  and public.current_member_role(organization_id) <> 'field'
)
with check (
  public.is_organization_member(organization_id)
  and public.current_member_role(organization_id) <> 'field'
);

create policy "Field members view their assigned jobs"
on public.jobs for select
to authenticated
using (
  public.current_member_role(organization_id) = 'field'
  and assigned_to = auth.uid()
);

create policy "Field members update status and notes on their jobs"
on public.jobs for update
to authenticated
using (
  public.current_member_role(organization_id) = 'field'
  and assigned_to = auth.uid()
)
with check (
  public.current_member_role(organization_id) = 'field'
  and assigned_to = auth.uid()
);