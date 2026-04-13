-- Add welcome screen tracking flag
alter table profiles add column has_seen_welcome boolean default false;
