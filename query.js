const { createClient } = require('@supabase/supabase-js');

const url = 'https://fxlwlsvkvxdqylnjjjyh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHdsc3ZrdnhkcXlsbmpqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3NzMxMCwiZXhwIjoyMDk1OTUzMzEwfQ.--LH2cjGsPQ0dMhLy8Tn-nEU_olCFZrTIkhpff3dn9A';

const sb = createClient(url, key);

async function query() {
  // Get task ID for "Birbirimize dua"
  const { data: task } = await sb
    .from('tasks')
    .select('id')
    .eq('title', 'Birbirimize dua')
    .single();

  if (!task) {
    console.log('Task not found');
    return;
  }

  console.log('Task ID:', task.id);

  // Get user ID for AceleciPenguen78
  const { data: user } = await sb
    .from('users')
    .select('id')
    .eq('username', 'AceleciPenguen78')
    .single();

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User ID:', user.id);

  // Get all completions for this task
  const { data: completions } = await sb
    .from('task_completions')
    .select('*')
    .eq('task_id', task.id)
    .eq('user_id', user.id)
    .order('completed_for_date', { ascending: false });

  console.log('\nCompletions for Birbirimize dua:');
  completions.forEach(c => {
    console.log(`  ${c.completed_for_date}: ${c.completed_at}`);
  });
  console.log(`Total: ${completions.length}`);

  // Get task details
  const { data: taskDetails } = await sb
    .from('tasks')
    .select('*')
    .eq('id', task.id)
    .single();

  console.log('\nTask details:');
  console.log(`  Title: ${taskDetails.title}`);
  console.log(`  Created by: ${taskDetails.created_by_user_id}`);
  console.log(`  Assigned to: ${taskDetails.assignee_user_id}`);
  console.log(`  Target per milestone: ${taskDetails.target_per_milestone}`);
}

query().catch(console.error);
