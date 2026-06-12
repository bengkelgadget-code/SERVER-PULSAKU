import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const refIds = [
    'MOB-1780301641311-97243A40',
    'MOB-1780139827456-9B175580'
  ];

  for (const ref of refIds) {
    console.log(`Deleting ${ref}...`);
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('ref_id', ref);

    if (error) {
      console.error(`Error deleting ${ref}:`, error);
    } else {
      console.log(`Successfully deleted ${ref}`);
    }
  }
}

main();
