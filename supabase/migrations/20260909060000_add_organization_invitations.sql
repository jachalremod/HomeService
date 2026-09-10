create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'field',
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index organization_invitations_organization_id_idx
on public.organization_invitations(organization_id);

create unique index organization_invitations_token_idx
on public.organization_invitations(token);

alter table public.organization_invitations enable row level security;

create policy "Admins view company invitations"
on public.organization_invitations for select to authenticated
using (public.is_organization_admin(organization_id));

create policy "Admins create company invitations"
on public.organization_invitations for insert to authenticated
with check (public.is_organization_admin(organization_id));

create policy "Admins delete company invitations"
on public.organization_invitations for delete to authenticated
using (public.is_organization_admin(organization_id));

-- Looks up an invitation by token without requiring the caller to
-- already belong to the organization (needed during signup).
create or replace function public.get_invitation_by_token(p_token uuid)
returns table (
  organization_id uuid,
  organization_name text,
  email text,
  role public.organization_role,
  expires_at timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    inv.organization_id,
    org.name,
    inv.email,
    inv.role,
    inv.expires_at,
    inv.accepted_at
  from public.organization_invitations as inv
  join public.organizations as org on org.id = inv.organization_id
  where inv.token = p_token;
$$;

revoke all on function public.get_invitation_by_token(uuid) from public;
grant execute on function public.get_invitation_by_token(uuid) to anon, authenticated;

-- Accepts an invitation for the currently-authenticated user.
create or replace function public.accept_organization_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation record;
  current_user_id uuid;
  current_user_email text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select inv.* into invitation
  from public.organization_invitations as inv
  where inv.token = p_token
  for update;

  if invitation is null then
    raise exception 'Invitation not found';
  end if;

  if invitation.accepted_at is not null then
    raise exception 'Invitation already used';
  end if;

  if invitation.expires_at < now() then
    raise exception 'Invitation expired';
  end if;

  select email into current_user_email
  from auth.users
  where id = current_user_id;

  if current_user_email is distinct from invitation.email then
    raise exception 'This invitation was sent to a different email address';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invitation.organization_id, current_user_id, invitation.role)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.organization_id;
end;
$$;

revoke all on function public.accept_organization_invitation(uuid) from public;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;