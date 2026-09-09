alter table public.estimate_items
add column if not exists title text;

with numbered_items as (
  select
    id,
    row_number() over (
      partition by estimate_id
      order by sort_order, created_at, id
    ) as item_number
  from public.estimate_items
)
update public.estimate_items as item
set title = 'Line item ' || numbered_items.item_number
from numbered_items
where numbered_items.id = item.id
  and nullif(btrim(item.title), '') is null;

alter table public.estimate_items
alter column title set not null;

alter table public.estimate_items
add constraint estimate_items_title_not_blank
check (nullif(btrim(title), '') is not null);