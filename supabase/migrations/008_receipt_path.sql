-- Store the storage path for receipts so we can mint a fresh signed URL
-- every time someone views them. Previously we stored a short-lived signed URL
-- directly in receipt_url, which meant the link died after one hour and the
-- image became permanently inaccessible.

alter table expenses add column if not exists receipt_path text;

-- Backfill: extract the storage path from any existing signed URL.
-- A signed URL looks like:
--   https://<project>.supabase.co/storage/v1/object/sign/receipts/<PATH>?token=...
-- We pull out the <PATH> piece (everything between "/sign/receipts/" and "?").
update expenses
set receipt_path = substring(
  receipt_url
  from '/storage/v1/object/sign/receipts/([^?]+)'
)
where receipt_path is null
  and receipt_url like '%/storage/v1/object/sign/receipts/%';

-- Also handle the (less common) public URL form, just in case:
--   https://<project>.supabase.co/storage/v1/object/public/receipts/<PATH>
update expenses
set receipt_path = substring(
  receipt_url
  from '/storage/v1/object/public/receipts/(.+)$'
)
where receipt_path is null
  and receipt_url like '%/storage/v1/object/public/receipts/%';

create index if not exists idx_expenses_receipt_path on expenses(receipt_path) where receipt_path is not null;
