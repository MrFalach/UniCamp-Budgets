-- Allow users to update their own profile (for has_seen_welcome, etc.)
create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
