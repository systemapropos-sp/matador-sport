/**
 * Run Migration v3 — ticket_sequences + print_count
 * node run-migration-v3.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://acvnyvsofwsatxqyjjfk.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdm55dnNvZndzYXR4cXlqamZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc4MzU0MiwiZXhwIjoyMDk2MzU5NTQyfQ.3w_FwFIOe4Xn-ilrcBSyTh9SXIMTs08j8unh61ScUMk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const STATEMENTS = [
  // 1. ticket_sequences table
  `CREATE TABLE IF NOT EXISTS public.ticket_sequences (
    id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id    uuid,
    banca_number   text NOT NULL DEFAULT '001',
    last_seq       bigint NOT NULL DEFAULT 0,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now(),
    CONSTRAINT ticket_sequences_business_unique UNIQUE (business_id)
  )`,

  // 2. print_count column on tickets
  `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS print_count integer NOT NULL DEFAULT 0`,

  // 3. increment_ticket_sequence RPC
  `CREATE OR REPLACE FUNCTION public.increment_ticket_sequence(p_business_id uuid)
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_seq    bigint;
     v_banca  text;
   BEGIN
     INSERT INTO public.ticket_sequences (business_id, banca_number, last_seq)
     VALUES (p_business_id, '001', 1)
     ON CONFLICT (business_id) DO UPDATE
       SET last_seq   = ticket_sequences.last_seq + 1,
           updated_at = now();

     SELECT last_seq, banca_number
       INTO v_seq, v_banca
       FROM public.ticket_sequences
      WHERE business_id = p_business_id;

     RETURN jsonb_build_object('seq', v_seq, 'banca_number', v_banca);
   END;
   $$`,

  // 4. Grant execute
  `GRANT EXECUTE ON FUNCTION public.increment_ticket_sequence(uuid) TO anon, authenticated`,
];

async function run() {
  console.log('🚀 Running Migration v3...\n');

  for (let i = 0; i < STATEMENTS.length; i++) {
    const stmt = STATEMENTS[i].trim();
    const preview = stmt.slice(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`  [${i + 1}/${STATEMENTS.length}] ${preview}... `);

    const { error } = await supabase.rpc('exec_sql', { query: stmt }).catch(() => ({ error: { message: 'RPC exec_sql not found - run manually in Supabase SQL Editor' } }));

    if (error) {
      // Try direct REST call
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt }),
        });
        const text = await resp.text();
        if (resp.ok) {
          console.log('✅');
        } else {
          console.log(`⚠️  ${text.slice(0, 80)}`);
        }
      } catch (e) {
        console.log(`❌ ${error.message}`);
      }
    } else {
      console.log('✅');
    }
  }

  console.log('\n✅ Migration v3 complete!');
  console.log('\n📝 NOTE: If any steps failed, run supabase-migration-v3.sql manually');
  console.log('   in your Supabase project → SQL Editor → New Query');
}

run().catch(console.error);
