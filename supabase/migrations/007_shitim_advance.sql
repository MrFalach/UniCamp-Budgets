-- Shitim advance: per-camp pre-paid amount that camps paid to the event up-front.
-- Counts as already-spent budget and gets reimbursed to the camp at season close.

-- 1. Add per-camp advance column
alter table camps add column shitim_advance numeric not null default 0;

-- 2. Ensure "מקדמה לשיטים" expense category exists
insert into expense_categories (name, color, sort_order, budget_cap)
select 'מקדמה לשיטים', '#0EA5E9', 10, 0
where not exists (select 1 from expense_categories where name = 'מקדמה לשיטים');
