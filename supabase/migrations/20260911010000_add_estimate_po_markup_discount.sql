alter table public.estimates
add column po_number text,
add column markup_type text check (markup_type in ('percentage', 'fixed')),
add column markup_value numeric(12,2) default 0,
add column discount_type text check (discount_type in ('percentage', 'fixed')),
add column discount_value numeric(12,2) default 0;