create or replace function public.handle_new_serviceaxiom_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
  company_name text;
  invitation_token uuid;
  invitation record;
  found_invitation boolean := false;
begin
  invitation_token := (new.raw_user_meta_data ->> 'invitation_token')::uuid;

  if invitation_token is not null then
    select inv.* into invitation
    from public.organization_invitations as inv
    where inv.token = invitation_token
      and inv.accepted_at is null
      and inv.expires_at > now()
      and inv.email = new.email
    limit 1;

    found_invitation := found;

    if found_invitation then
      insert into public.organization_members (organization_id, user_id, role)
      values (invitation.organization_id, new.id, invitation.role)
      on conflict (organization_id, user_id) do nothing;

      update public.organization_invitations
      set accepted_at = now()
      where id = invitation.id;

      return new;
    end if;
  end if;

  company_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'business_name'), ''),
    'ServiceAxiom Contractor'
  );

  insert into public.organizations (name, slug, created_by)
  values (company_name, 'company-' || replace(new.id::text, '-', ''), new.id)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, new.id, 'owner');

  insert into public.business_profiles (user_id, organization_id, company_name, owner_name, email)
  values (
    new.id,
    new_organization_id,
    company_name,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;