const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function query() {
  const { data: user } = await sb
    .from('users')
    .select('id, group_id')
    .eq('username', 'AceleciPenguen78')
    .single();

  console.log('User:', user);

  const { data: group } = await sb
    .from('groups')
    .select('*')
    .eq('id', user.group_id)
    .single();

  console.log('Group:', group);

  const { data: comps } = await sb
    .from('task_completions')
    .select('completed_for_date, task_id, tasks(title)')
    .eq('user_id', user.id)
    .order('completed_for_date', { ascending: false })
    .limit(15);

  console.log('\nAll recent completions:');
  comps.forEach(c => {
    console.log(`  ${c.completed_for_date}: ${c.tasks?.title}`);
  });
}

query().catch(console.error);
