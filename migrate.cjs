const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://acvnyvsofwsatxqyjjfk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdm55dnNvZndzYXR4cXlqamZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc4MzU0MiwiZXhwIjoyMDk2MzU5NTQyfQ.3w_FwFIOe4Xn-ilrcBSyTh9SXIMTs08j8unh61ScUMk'
);

async function checkTables() {
  console.log('\n🔍 Checking existing columns...');
  
  // Check if verification_code exists
  const { data: t1, error: e1 } = await supabase
    .from('tickets')
    .select('verification_code')
    .limit(1);
  
  if (e1) {
    console.log('  ⚠️  verification_code column missing:', e1.message);
  } else {
    console.log('  ✅ verification_code column EXISTS');
  }

  // Check ticket_sequences
  const { data: t2, error: e2 } = await supabase
    .from('ticket_sequences')
    .select('*')
    .limit(1);
  
  if (e2) {
    console.log('  ⚠️  ticket_sequences table missing:', e2.message);
  } else {
    console.log('  ✅ ticket_sequences table EXISTS, rows:', t2?.length || 0);
  }
  
  console.log('\n📋 Actions needed in Supabase SQL Editor:');
  if (e1) console.log('  → ALTER TABLE tickets ADD COLUMN IF NOT EXISTS verification_code TEXT;');
  if (e2) console.log('  → Run supabase_updates.sql in Supabase Dashboard');
  
  if (!e1 && !e2) {
    console.log('  🎉 Everything looks good! No migration needed.');
  }
}

checkTables().catch(console.error);
