create or replace function public.current_member_role(p_organization_id uuid)
returns public.organization_role
language sql
stable
security definer
set search_path = ''
as $$
  select member.role
  from public.organization_members as member
  where member.organization_id = p_organization_id
    and member.user_id = auth.uid();
$$;

revoke all on function public.current_member_role(uuid) from public;
grant execute on function public.current_member_role(uuid) to authenticated;
