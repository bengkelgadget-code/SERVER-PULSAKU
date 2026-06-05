import { digiflazz } from '@/infrastructure/digiflazz/client';
import { createAdminClient } from '@/infrastructure/supabase/server';

export async function syncDigiFlazzProducts() {
  const supabase = createAdminClient();

  try {
    // Fetch BOTH prepaid and postpaid (which includes PLN Token)
    const [prepaidRes, postpaidRes] = await Promise.allSettled([
      digiflazz.getPriceList('prepaid'),
      digiflazz.getPriceList('pasca'),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allProducts: any[] = [];

    if (prepaidRes.status === 'fulfilled') {
      allProducts = allProducts.concat(prepaidRes.value.data || []);
    }
    if (postpaidRes.status === 'fulfilled') {
      allProducts = allProducts.concat(postpaidRes.value.data || []);
    }

    if (allProducts.length === 0) {
      return { success: false, error: 'Tidak ada produk dari DigiFlazz' };
    }

    // Deduplicate by sku_code
    const uniqueProductsMap = new Map();
    for (const p of allProducts) {
      uniqueProductsMap.set(p.buyer_sku_code, p);
    }
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    const upsertData = uniqueProducts.map(p => {
      const isActive = p.buyer_product_status === true && p.seller_product_status === true;
      return {
        sku_code: p.buyer_sku_code,
        product_name: p.product_name,
        category: p.category,
        brand: p.brand,
        harga_modal: p.price,
        // Default markup: modal + 500, minimum 1000 for expensive items
        harga_jual: Math.max(p.price + 500, Math.round(p.price * 1.03)),
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };
    });

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
    for (const { error } of results) {
      if (error) {
        console.error("Error syncing products to Supabase", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true, count: upsertData.length };
  } catch (error: unknown) {
    console.error("Error fetching from DigiFlazz", error);
    return { success: false, error: (error as Error).message };
  }
}
