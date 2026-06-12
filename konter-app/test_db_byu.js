const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Check all byu SKUs in database
  const { data } = await supabase
    .from("products")
    .select("sku_code, product_name, category, brand, is_active")
    .ilike("sku_code", "byu%");
  
  console.log("byu products in DB:", data ? data.length : 0);
  if (data) data.forEach(p => console.log(p));
  
  console.log("\n---\n");
  
  // Check exact brand names in Pulsa category
  const { data: brands } = await supabase
    .from("products")
    .select("brand")
    .eq("category", "Pulsa")
    .order("brand");
  
  const uniqueBrands = [...new Set(brands.map(b => b.brand))];
  console.log("All brands in Pulsa:", uniqueBrands);
}
check().catch(console.error);
