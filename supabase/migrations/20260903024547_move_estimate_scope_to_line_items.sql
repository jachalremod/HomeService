-- Add an existing estimate-level scope to its first line item.
with ranked_items as (
  select
    id,
    estimate_id,
    row_number() over (
      partition by estimate_id
      order by sort_order, created_at, id
    ) as item_position
  from public.estimate_items
)
update public.estimate_items as item
set description =
  case
    when nullif(btrim(item.description), '') is null
      then estimate.description
    else estimate.description || E'\n\n' || item.description
  end
from public.estimates as estimate,
     ranked_items
where ranked_items.id = item.id
  and ranked_items.estimate_id = estimate.id
  and ranked_items.item_position = 1
  and nullif(btrim(estimate.description), '') is not null;

-- Preserve scope as a new zero-dollar line item if an old estimate has no items.
insert into public.estimate_items (
  user_id,
  estimate_id,
  description,
  quantity,
  unit_price,
  amount,
  sort_order
)
select
  estimate.user_id,
  estimate.id,
  estimate.description,
  1,
  0,
  0,
  0
from public.estimates as estimate
where nullif(btrim(estimate.description), '') is not null
  and not exists (
    select 1
    from public.estimate_items as item
    where item.estimate_id = estimate.id
  );

-- Clear the old estimate-level scope after preserving it.
update public.estimates
set description = null
where description is not null;