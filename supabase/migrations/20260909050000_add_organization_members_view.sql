create or replace function public.get_organization_members(p_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.organization_role,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    member.user_id,
    au.email,
    member.role,
    member.created_at
  from public.organization_members as member
  join auth.users as au on au.id = member.user_id
  where member.organization_id = p_organization_id
    and public.is_organization_member(p_organization_id)
  order by member.created_at;
$$;

revoke all on function public.get_organization_members(uuid) from public;
grant execute on function public.get_organization_members(uuid) to authenticated;