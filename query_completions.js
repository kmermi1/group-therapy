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

  if (!user) {
    console.log('User not found');
    return;
  }

  const { data: comps } = await sb
    .from('task_completions')
    .select('task_id, completed_for_date, tasks(title)')
    .eq('user_id', user.id)
    .order('completed_for_date', { ascending: false })
    .limit(15);

  console.log('\nRecent completions by date:');
  const grouped = {};
  (comps || []).forEach(c => {
    const date = c.completed_for_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(c.tasks?.title || 'Unknown');
  });
  
  Object.entries(grouped).forEach(([date, tasks]) => {
    console.log(`  ${date}: ${tasks.join(', ')}`);
  });
}

query().catch(console.error);
