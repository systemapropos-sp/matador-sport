-- ============================================================
-- NMV Lottery — Barcode Migration
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/acvnyvsofwsatxqyjjfk/editor
-- ============================================================

-- 1. Add barcode column (if not exists)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 2. Create unique index for barcode lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_barcode
  ON public.tickets (barcode)
  WHERE barcode IS NOT NULL;

-- 3. Create standard index for speed
CREATE INDEX IF NOT EXISTS idx_tickets_barcode_lookup
  ON public.tickets (barcode);

-- 4. Verify column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND table_schema = 'public'
  AND column_name = 'barcode';
-- Expected: barcode | text
