alter table public.invoices
add column public_token uuid not null default gen_random_uuid();

alter table public.invoices
add constraint invoices_public_token_key unique (public_token);

create index invoices_public_token_idx
on public.invoices(public_token);
