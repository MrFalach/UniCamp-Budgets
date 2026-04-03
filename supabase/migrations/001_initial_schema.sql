-- App Settings
create table app_settings (
  id int primary key default 1,
  event_name text default 'מידברן 2025',
  event_year int default 2025,
  season_status text check (season_status in ('active', 'closed')) default 'active',
  budget_warning_threshold int default 80,
  updated_at timestamptz default now()
);

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('admin', 'camp')) default 'camp',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Camps
create table camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_budget numeric not null default 0,
  description text,
  is_active boolean default true,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  bank_branch text,
  created_at timestamptz default now()
);

-- Camp Members
create table camp_members (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid references camps(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  unique(camp_id, user_id)
);

-- Expense Categories
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  budget_cap numeric,
  sort_order int default 0
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid references camps(id),
  submitted_by uuid references profiles(id),
  amount numeric not null,
  description text not null,
  category_id uuid references expense_categories(id),
  receipt_url text,
  receipt_type text check (receipt_type in ('image', 'pdf')),
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  admin_note text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  is_archived boolean default false
);

-- Expense Comments
create table expense_comments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- Reimbursements
create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid references camps(id),
  total_amount numeric not null,
  status text check (status in ('pending', 'paid')) default 'pending',
  payment_method text check (payment_method in ('bank_transfer', 'bit', 'cash', 'other')),
  payment_reference text,
  paid_at timestamptz,
  paid_by uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- Audit Logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index idx_expenses_camp_id on expenses(camp_id);
create index idx_expenses_status on expenses(status);
create index idx_expenses_submitted_at on expenses(submitted_at);
create index idx_expenses_category_id on expenses(category_id);
create index idx_camp_members_user_id on camp_members(user_id);
create index idx_camp_members_camp_id on camp_members(camp_id);
create index idx_expense_comments_expense_id on expense_comments(expense_id);
create index idx_reimbursements_camp_id on reimbursements(camp_id);
create index idx_audit_logs_created_at on audit_logs(created_at);
create index idx_audit_logs_actor_id on audit_logs(actor_id);

-- Storage bucket for receipts
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

---------------------
-- RLS POLICIES
---------------------

alter table profiles enable row level security;
alter table camps enable row level security;
alter table camp_members enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table expense_comments enable row level security;
alter table reimbursements enable row level security;
alter table audit_logs enable row level security;
alter table app_settings enable row level security;

-- Helper: check if user is admin
create or replace function is_admin()
returns boolean as $$
  select exists(
    select 1 from profiles where id = auth.uid() and role = 'admin' and is_active = true
  );
$$ language sql security definer;

-- Helper: check if user is member of camp
create or replace function is_camp_member(camp uuid)
returns boolean as $$
  select exists(
    select 1 from camp_members where camp_id = camp and user_id = auth.uid()
  );
$$ language sql security definer;

-- Profiles
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Admins can view all profiles" on profiles for select using (is_admin());
create policy "Admins can update all profiles" on profiles for update using (is_admin());
create policy "Admins can insert profiles" on profiles for insert with check (is_admin());

-- Camps
create policy "Camp members can view their camp" on camps for select using (
  is_admin() or exists(select 1 from camp_members where camp_id = camps.id and user_id = auth.uid())
);
create policy "Admins full access camps" on camps for all using (is_admin());

-- Camp Members
create policy "Members can view own membership" on camp_members for select using (user_id = auth.uid() or is_admin());
create policy "Admins manage memberships" on camp_members for all using (is_admin());

-- Expense Categories
create policy "Anyone can view categories" on expense_categories for select using (true);
create policy "Admins manage categories" on expense_categories for all using (is_admin());

-- Expenses
create policy "Camp members can view own camp expenses" on expenses for select using (
  is_admin() or is_camp_member(camp_id)
);
create policy "Camp members can insert expenses" on expenses for insert with check (
  is_camp_member(camp_id) and submitted_by = auth.uid()
);
create policy "Admins full access expenses" on expenses for all using (is_admin());

-- Expense Comments
create policy "View comments on accessible expenses" on expense_comments for select using (
  is_admin() or exists(
    select 1 from expenses e
    join camp_members cm on cm.camp_id = e.camp_id
    where e.id = expense_comments.expense_id and cm.user_id = auth.uid()
  )
);
create policy "Insert comments on accessible expenses" on expense_comments for insert with check (
  author_id = auth.uid() and (
    is_admin() or exists(
      select 1 from expenses e
      join camp_members cm on cm.camp_id = e.camp_id
      where e.id = expense_comments.expense_id and cm.user_id = auth.uid()
    )
  )
);
create policy "Admins manage comments" on expense_comments for all using (is_admin());

-- Reimbursements
create policy "Camp members view own reimbursement" on reimbursements for select using (
  is_admin() or is_camp_member(camp_id)
);
create policy "Admins manage reimbursements" on reimbursements for all using (is_admin());

-- App Settings
create policy "Anyone can view settings" on app_settings for select using (true);
create policy "Admins manage settings" on app_settings for all using (is_admin());

-- Audit Logs
create policy "Admins view audit logs" on audit_logs for select using (is_admin());
create policy "Authenticated users can insert logs" on audit_logs for insert with check (auth.uid() is not null);

-- Storage policies for receipts
create policy "Camp members can upload receipts" on storage.objects for insert with check (
  bucket_id = 'receipts' and auth.uid() is not null
);
create policy "Authenticated users can view receipts" on storage.objects for select using (
  bucket_id = 'receipts' and auth.uid() is not null
);
create policy "Admins can delete receipts" on storage.objects for delete using (
  bucket_id = 'receipts' and exists(
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
