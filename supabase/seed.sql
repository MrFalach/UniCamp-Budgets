-- Seed app settings
insert into app_settings (id, event_name, event_year, season_status, budget_warning_threshold)
values (1, 'מידברן 2025', 2025, 'active', 80)
on conflict (id) do nothing;

-- Seed expense categories
insert into expense_categories (name, color, sort_order) values
  ('גיפטינג', '#F472B6', 0),
  ('ציוד', '#3B82F6', 1),
  ('מזון', '#10B981', 2),
  ('אנרגיה', '#F59E0B', 3),
  ('עיצוב', '#8B5CF6', 4),
  ('לוגיסטיקה', '#EF4444', 5),
  ('אחר', '#6B7280', 6);
