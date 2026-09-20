create or replace function public.next_document_number_for_org(
  p_user_id uuid,
  p_organization_id uuid,
  p_document_type text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  allocated_number bigint;
begin
  if p_document_type not in ('estimate', 'invoice', 'work_order') then
    raise exception 'Invalid document type';
  end if;

  insert into public.document_counters (
    user_id,
    organization_id,
    document_type,
    next_number
  )
  values (p_user_id, p_organization_id, p_document_type, 1)
  on conflict (organization_id, document_type)
  do update set next_number = public.document_counters.next_number + 1
  returning next_number - 1 into allocated_number;

  return allocated_number;
end;
$$;

revoke all on function public.next_document_number_for_org(uuid, uuid, text) from public;
grant execute on function public.next_document_number_for_org(uuid, uuid, text) to service_role;