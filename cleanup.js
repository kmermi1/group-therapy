const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function cleanup() {
  const { data: user } = await sb
    .from('users')
    .select('id')
    .eq('username', 'AceleciPenguen78')
    .single();

  // Delete 2026-06-04 completions for Evvabin and Sukur namazi
  const taskNames = ['Evvabin', 'Sukur namazi'];
  
  for (const name of taskNames) {
    const { data: task } = await sb
      .from('tasks')
      .select('id')
      .eq('title', name)
      .single();

    if (task) {
      const { error } = await sb
        .from('task_completions')
        .delete()
        .eq('task_id', task.id)
        .eq('user_id', user.id)
        .eq('completed_for_date', '2026-06-04');

      if (error) {
        console.log(`Error deleting ${name}:`, error.message);
      } else {
        console.log(`✓ Deleted 2026-06-04 completion for "${name}"`);
      }
    }
  }
  
  console.log('\nCleanup complete!');
}

cleanup().catch(console.error);
