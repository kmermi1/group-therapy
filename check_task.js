const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function query() {
  console.log('Checking Birbirimize dua completions...\n');
  
  const { data: user } = await sb
    .from('users')
    .select('id')
    .eq('username', 'AceleciPenguen78')
    .single();

  const { data: task } = await sb
    .from('tasks')
    .select('id, title')
    .eq('title', 'Birbirimize dua')
    .single();

  if (!task) {
    console.log('Task not found');
    return;
  }

  const { data: comps } = await sb
    .from('task_completions')
    .select('completed_for_date')
    .eq('task_id', task.id)
    .eq('user_id', user.id)
    .order('completed_for_date', { ascending: false });

  if (comps && comps.length > 0) {
    console.log(`Found ${comps.length} completions for "${task.title}":`);
    comps.forEach(c => {
      console.log(`  - ${c.completed_for_date}`);
    });
  } else {
    console.log(`No completions found for "${task.title}"`);
  }
}

query().catch(console.error);
