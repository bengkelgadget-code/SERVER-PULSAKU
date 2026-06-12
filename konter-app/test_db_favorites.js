const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabaseAdmin.from('favorites').select('*').limit(1);
  if (error) {
    console.log("Error checking favorites table:", error.message);
  } else {
    console.log("Favorites table exists.");
  }
}
check().catch(console.error);
