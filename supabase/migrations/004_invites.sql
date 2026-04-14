-- Invite indirection table: preview-safe invite links
-- Admin shares /invite/<nonce> instead of raw Supabase action_links.
-- The Supabase single-use token is only minted when the human clicks "set password".

create table invites (
  nonce text primary key default replace(gen_random_uuid()::text, '-', ''),
  email text not null,
  camp_id uuid references camps(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  consumed_at timestamptz
);

create index idx_invites_email on invites(email);
create index idx_invites_expires_at on invites(expires_at);

-- Allow service role full access (admin client). No RLS for anon —
-- the invite page reads via admin client on the server side.
alter table invites enable row level security;

-- Admin (service role) bypasses RLS. Authenticated admins can read/write via server actions.
create policy "Admins can manage invites"
  on invites for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
