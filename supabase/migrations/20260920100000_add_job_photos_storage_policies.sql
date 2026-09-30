create policy "Non-field members manage job photo files"
on storage.objects for all to authenticated
using (
  bucket_id = 'job-photos'
  and exists (
    select 1 from public.job_photos
    where job_photos.storage_path = storage.objects.name
      and public.is_organization_member(job_photos.organization_id)
      and public.current_member_role(job_photos.organization_id) <> 'field'
  )
)
with check (bucket_id = 'job-photos');

create policy "Field members manage their job photo files"
on storage.objects for all to authenticated
using (
  bucket_id = 'job-photos'
  and exists (
    select 1 from public.job_photos
    join public.jobs on jobs.id = job_photos.job_id
    where job_photos.storage_path = storage.objects.name
      and jobs.assigned_to = auth.uid()
  )
)
with check (bucket_id = 'job-photos');

create policy "Authenticated users can upload job photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'job-photos');