const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Test with ANON key (like a logged-in user would see)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabaseAnon
    .from("products")
    .select("sku_code, is_active")
    .eq("category", "Pulsa")
    .eq("brand", "by.U");
  
  console.log("With ANON key - count:", data ? data.length : 0, "error:", error?.message);
  
  // Admin key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: data2 } = await supabaseAdmin
    .from("products")
    .select("sku_code, is_active")
    .eq("category", "Pulsa")
    .eq("brand", "by.U");
  
  console.log("With SERVICE ROLE key - count:", data2 ? data2.length : 0);
}
check().catch(console.error);
