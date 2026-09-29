alter table public.jobs
add column assigned_to uuid references auth.users(id) on delete set null;

create index jobs_assigned_to_idx on public.jobs(assigned_to);