const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Simulate exactly what the admin page does 
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Pulsa")
    .eq("brand", "by.U")
    .order("brand", { ascending: true })
    .order("harga_jual", { ascending: true });
  
  console.log("Result count:", data ? data.length : 0);
  console.log("Error:", error);
  if (data) {
    data.forEach(p => console.log(p.sku_code, p.is_active, p.harga_jual));
  }
}
check().catch(console.error);
