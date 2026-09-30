drop policy if exists "Members manage company estimates" on public.estimates;
create policy "Non-field members manage company estimates"
on public.estimates for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

drop policy if exists "Members manage company estimate items" on public.estimate_items;
create policy "Non-field members manage company estimate items"
on public.estimate_items for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

drop policy if exists "Members manage company invoices" on public.invoices;
create policy "Non-field members manage company invoices"
on public.invoices for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

drop policy if exists "Members manage company payment schedules" on public.payment_schedules;
create policy "Non-field members manage company payment schedules"
on public.payment_schedules for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

drop policy if exists "Members manage company payments" on public.payments;
create policy "Non-field members manage company payments"
on public.payments for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

drop policy if exists "Members manage company work orders" on public.work_orders;
create policy "Non-field members manage company work orders"
on public.work_orders for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');