-- ============================================================
-- NMV Lottery — Supabase FULL Tables Setup v2
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Safe to run multiple times (IF NOT EXISTS + ALTER ... ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════
-- 1. nmv_clients  (Clientes del módulo móvil)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nmv_clients (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text UNIQUE,
  username      text UNIQUE NOT NULL,
  full_name     text NOT NULL,
  email         text,
  phone         text,
  password      text,
  pin           text,
  balance       numeric(12,2) DEFAULT 0,
  language      text DEFAULT 'es',
  banca_code    text,
  business_id   uuid,
  created_by    text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
-- Add columns if table already existed without them
ALTER TABLE nmv_clients ADD COLUMN IF NOT EXISTS business_id  uuid;
ALTER TABLE nmv_clients ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();
ALTER TABLE nmv_clients ADD COLUMN IF NOT EXISTS last_login   timestamptz;

CREATE INDEX IF NOT EXISTS nmv_clients_banca_idx      ON nmv_clients(banca_code);
CREATE INDEX IF NOT EXISTS nmv_clients_username_idx   ON nmv_clients(username);
CREATE INDEX IF NOT EXISTS nmv_clients_code_idx       ON nmv_clients(code);
CREATE INDEX IF NOT EXISTS nmv_clients_business_idx   ON nmv_clients(business_id);

ALTER TABLE nmv_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nmv_clients_all" ON nmv_clients;
CREATE POLICY "nmv_clients_all" ON nmv_clients FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 2. nmv_transactions  (Recargas / Retiros / Cancelaciones)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nmv_transactions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     uuid REFERENCES nmv_clients(id) ON DELETE SET NULL,
  client_code   text,
  client_name   text,
  type          text CHECK (type IN ('recarga','retiro','cancelacion')) NOT NULL,
  amount        numeric(12,2) NOT NULL,
  banca_code    text,
  business_id   uuid,
  created_by    text,
  status        text DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE nmv_transactions ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE INDEX IF NOT EXISTS nmv_tx_client_idx  ON nmv_transactions(client_id);
CREATE INDEX IF NOT EXISTS nmv_tx_banca_idx   ON nmv_transactions(banca_code);
CREATE INDEX IF NOT EXISTS nmv_tx_created_idx ON nmv_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS nmv_tx_type_idx    ON nmv_transactions(type);
CREATE INDEX IF NOT EXISTS nmv_tx_biz_idx     ON nmv_transactions(business_id);

ALTER TABLE nmv_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nmv_tx_all" ON nmv_transactions;
CREATE POLICY "nmv_tx_all" ON nmv_transactions FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 3. vendor_clients  (Clientes crédito/contado del vendedor)
--    Reemplaza el localStorage('matador_clients')
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vendor_clients (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id   uuid,
  vendor_id     text,
  name          text NOT NULL,
  phone         text,
  cedula        text,
  address       text,
  type          text DEFAULT 'contado' CHECK (type IN ('contado','credito')),
  credit_limit  numeric(12,2) DEFAULT 0,
  balance       numeric(12,2) DEFAULT 0,
  is_closed     boolean DEFAULT false,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vc_business_idx ON vendor_clients(business_id);
CREATE INDEX IF NOT EXISTS vc_vendor_idx   ON vendor_clients(vendor_id);
CREATE INDEX IF NOT EXISTS vc_phone_idx    ON vendor_clients(phone);

ALTER TABLE vendor_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendor_clients_all" ON vendor_clients;
CREATE POLICY "vendor_clients_all" ON vendor_clients FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 4. vendor_payments  (Pagos de clientes de crédito)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vendor_payments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     uuid REFERENCES vendor_clients(id) ON DELETE SET NULL,
  business_id   uuid,
  vendor_id     text,
  amount        numeric(12,2) NOT NULL,
  note          text,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vp_client_idx   ON vendor_payments(client_id);
CREATE INDEX IF NOT EXISTS vp_business_idx ON vendor_payments(business_id);
CREATE INDEX IF NOT EXISTS vp_created_idx  ON vendor_payments(created_at DESC);

ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendor_payments_all" ON vendor_payments;
CREATE POLICY "vendor_payments_all" ON vendor_payments FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 5. nmv_client_tickets  (Tickets de sorteo del cliente móvil)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nmv_client_tickets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     uuid REFERENCES nmv_clients(id) ON DELETE CASCADE,
  client_code   text,
  ticket_id     uuid,
  ticket_number text NOT NULL,
  lottery_name  text,
  amount        numeric(12,2) DEFAULT 0,
  prize_amount  numeric(12,2) DEFAULT 0,
  status        text DEFAULT 'pending' CHECK (status IN ('pending','winner','loser','cancelled','paid')),
  banca_code    text,
  business_id   uuid,
  draw_date     date,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE nmv_client_tickets ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE INDEX IF NOT EXISTS nmv_ct_client_idx  ON nmv_client_tickets(client_id);
CREATE INDEX IF NOT EXISTS nmv_ct_status_idx  ON nmv_client_tickets(status);
CREATE INDEX IF NOT EXISTS nmv_ct_date_idx    ON nmv_client_tickets(draw_date DESC);
CREATE INDEX IF NOT EXISTS nmv_ct_biz_idx     ON nmv_client_tickets(business_id);

ALTER TABLE nmv_client_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nmv_ct_all" ON nmv_client_tickets;
CREATE POLICY "nmv_ct_all" ON nmv_client_tickets FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 6. nmv_sessions  (Sesiones activas clientes móvil)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nmv_sessions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    uuid REFERENCES nmv_clients(id) ON DELETE CASCADE,
  client_code  text,
  device_info  text,
  ip_address   text,
  token        text UNIQUE,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now(),
  last_seen    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nmv_sess_client_idx  ON nmv_sessions(client_id);
CREATE INDEX IF NOT EXISTS nmv_sess_token_idx   ON nmv_sessions(token);
CREATE INDEX IF NOT EXISTS nmv_sess_expires_idx ON nmv_sessions(expires_at);

ALTER TABLE nmv_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nmv_sess_all" ON nmv_sessions;
CREATE POLICY "nmv_sess_all" ON nmv_sessions FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 7. nmv_daily_reports  (Cierres de caja diarios)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nmv_daily_reports (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     uuid,
  vendor_id       text,
  report_date     date NOT NULL,
  total_sales     numeric(12,2) DEFAULT 0,
  total_prizes    numeric(12,2) DEFAULT 0,
  total_pending   numeric(12,2) DEFAULT 0,
  ticket_count    integer DEFAULT 0,
  winner_count    integer DEFAULT 0,
  notes           text,
  closed_by       text,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE nmv_daily_reports ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS dr_business_idx ON nmv_daily_reports(business_id);
CREATE INDEX IF NOT EXISTS dr_date_idx     ON nmv_daily_reports(report_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS dr_biz_date_idx ON nmv_daily_reports(business_id, report_date, vendor_id);

ALTER TABLE nmv_daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dr_all" ON nmv_daily_reports;
CREATE POLICY "dr_all" ON nmv_daily_reports FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 8. vendors  (Vendedores registrados — si no existe ya)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vendors (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid,
  name        text NOT NULL,
  pin         text NOT NULL,
  role        text DEFAULT 'vendor' CHECK (role IN ('vendor','supervisor','admin')),
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_id uuid;
CREATE INDEX IF NOT EXISTS vendors_biz_idx ON vendors(business_id);
CREATE INDEX IF NOT EXISTS vendors_pin_idx ON vendors(pin);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors_all" ON vendors;
CREATE POLICY "vendors_all" ON vendors FOR ALL USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- DONE — All tables created / updated
-- ════════════════════════════════════════════════════════════
SELECT 'NMV Lottery tables OK ✅' AS status;
