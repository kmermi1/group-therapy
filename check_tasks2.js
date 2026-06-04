const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function query() {
  const { data: user } = await sb
    .from('users')
    .select('id')
    .eq('username', 'AceleciPenguen78')
    .single();

  console.log('Tasks with completions on 2026-06-04:\n');
  
  const { data: comps } = await sb
    .from('task_completions')
    .select('completed_for_date, tasks(title)')
    .eq('user_id', user.id)
    .eq('completed_for_date', '2026-06-04');

  const unique = {};
  (comps || []).forEach(c => {
    unique[c.tasks.title] = true;
  });

  Object.keys(unique).forEach(title => {
    console.log(`  ✓ ${title}`);
  });
}

query().catch(console.error);
