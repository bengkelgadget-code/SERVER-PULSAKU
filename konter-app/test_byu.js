const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('products').select('*').eq('category', 'Pulsa').eq('brand', 'by.U');
  console.log('Error:', error);
  console.log('Count:', data ? data.length : 0);
}
check();
