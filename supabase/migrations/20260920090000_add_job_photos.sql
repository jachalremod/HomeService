create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index job_photos_job_id_idx on public.job_photos(job_id);

alter table public.job_photos enable row level security;

create policy "Non-field members manage company job photos"
on public.job_photos for all to authenticated
using (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field')
with check (public.is_organization_member(organization_id) and public.current_member_role(organization_id) <> 'field');

create policy "Field members manage photos on their assigned jobs"
on public.job_photos for all to authenticated
using (
  public.current_member_role(organization_id) = 'field'
  and exists (select 1 from public.jobs where jobs.id = job_photos.job_id and jobs.assigned_to = auth.uid())
)
with check (
  public.current_member_role(organization_id) = 'field'
  and exists (select 1 from public.jobs where jobs.id = job_photos.job_id and jobs.assigned_to = auth.uid())
);