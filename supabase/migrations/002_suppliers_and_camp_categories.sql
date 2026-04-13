-- Add entity type to camps (camp or supplier)
alter table camps add column type text check (type in ('camp', 'supplier')) default 'camp';

-- Set all existing camps to type 'camp'
update camps set type = 'camp' where type is null;

-- Make type not null after backfill
alter table camps alter column type set not null;

-- Create camp_categories junction table
create table camp_categories (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references camps(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete cascade,
  created_at timestamptz default now(),
  unique(camp_id, category_id)
);

-- Indexes
create index idx_camp_categories_camp_id on camp_categories(camp_id);
create index idx_camp_categories_category_id on camp_categories(category_id);

-- Ensure "גיפטינג" category exists
insert into expense_categories (name, color, sort_order)
select 'גיפטינג', '#F472B6', 0
where not exists (select 1 from expense_categories where name = 'גיפטינג');

-- Auto-assign "גיפטינג" to all existing camps (type='camp')
insert into camp_categories (camp_id, category_id)
select c.id, ec.id
from camps c
cross join expense_categories ec
where c.type = 'camp' and ec.name = 'גיפטינג'
on conflict (camp_id, category_id) do nothing;

-- RLS for camp_categories
alter table camp_categories enable row level security;

create policy "Anyone can view camp categories" on camp_categories for select using (true);
create policy "Admins manage camp categories" on camp_categories for all using (is_admin());
