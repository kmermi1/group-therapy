const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function query() {
  // Get user's group
  const { data: user } = await sb
    .from('users')
    .select('group_id, group:groups(id, name, timezone)')
    .eq('username', 'AceleciPenguen78')
    .single();

  console.log('User group:', user);

  // Get all completions for this user today
  const { data: comps } = await sb
    .from('task_completions')
    .select('completed_for_date, tasks(title)')
    .eq('user_id', user.id)
    .order('completed_for_date', { ascending: false })
    .limit(10);

  console.log('\nAll recent completions:');
  comps.forEach(c => {
    console.log(`  ${c.completed_for_date}: ${c.tasks.title}`);
  });
}

query().catch(console.error);
