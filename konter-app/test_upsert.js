const { digiflazz } = require('./src/infrastructure/digiflazz/client.ts');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.time('fetch_digiflazz');
  const [prepaidRes, postpaidRes] = await Promise.allSettled([
      digiflazz.getPriceList('prepaid'),
      digiflazz.getPriceList('postpaid'),
  ]);
  console.timeEnd('fetch_digiflazz');
  
  let allProducts = [];
  if (prepaidRes.status === 'fulfilled') allProducts = allProducts.concat(prepaidRes.value.data || []);
  if (postpaidRes.status === 'fulfilled') allProducts = allProducts.concat(postpaidRes.value.data || []);
  
  console.log('Total products:', allProducts.length);
  const upsertData = allProducts.map(p => {
      const isActive = p.buyer_product_status === true && p.seller_product_status === true;
      return {
        sku_code: p.buyer_sku_code,
        product_name: p.product_name,
        category: p.category,
        brand: p.brand,
        harga_modal: p.price,
        harga_jual: Math.max(p.price + 500, Math.round(p.price * 1.03)),
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };
    });

  console.time('upsert');
  const CHUNK_SIZE = 1000;
  const promises = [];
  for (let i = 0; i < upsertData.length; i += CHUNK_SIZE) {
      const chunk = upsertData.slice(i, i + CHUNK_SIZE);
      promises.push(
        supabase.from('products').upsert(chunk, {
          onConflict: 'sku_code',
          ignoreDuplicates: false,
        })
      );
  }
  const results = await Promise.all(promises);
  console.timeEnd('upsert');
  
  results.forEach((r, i) => {
    if(r.error) console.log(Chunk  Error:, r.error);
  });
}
check();
