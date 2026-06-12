import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env', process.env); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);
async function main() {
  const { data, error } = await supabase.from('transactions').update({ status: 'sukses', sn: 'SN-MANUAL-123' }).eq('ref_id', 'MOB-1780360177042-3B3B70AF');
  console.log('Update result:', error || 'Success');
}
main();
