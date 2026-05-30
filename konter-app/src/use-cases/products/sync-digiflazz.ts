import { digiflazz } from '@/infrastructure/digiflazz/client';
import { createClient } from '@/infrastructure/supabase/server';

export async function syncDigiFlazzProducts() {
  const supabase = await createClient();

  try {
    // Fetch BOTH prepaid and postpaid (which includes PLN Token)
    const [prepaidRes, postpaidRes] = await Promise.allSettled([
      digiflazz.getPriceList('prepaid'),
      digiflazz.getPriceList('postpaid'),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allProducts: any[] = [];

    if (prepaidRes.status === 'fulfilled') {
      allProducts = allProducts.concat(prepaidRes.value.data || []);
    }
    if (postpaidRes.status === 'fulfilled') {
      allProducts = allProducts.concat(postpaidRes.value.data || []);
    }

    // Filter active products only
    const activeProducts = allProducts.filter(
      p => p.buyer_product_status === true && p.seller_product_status === true
    );

    if (activeProducts.length === 0) {
      return { success: false, error: 'Tidak ada produk aktif dari DigiFlazz' };
    }

    const upsertData = activeProducts.map(p => ({
      sku_code: p.buyer_sku_code,
      product_name: p.product_name,
      category: p.category,
      brand: p.brand,
      harga_modal: p.price,
      // Default markup: modal + 500, minimum 1000 for expensive items
      harga_jual: Math.max(p.price + 500, Math.round(p.price * 1.03)),
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('products')
      .upsert(upsertData, {
        onConflict: 'sku_code',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error syncing products to Supabase", error);
      return { success: false, error: error.message };
    }

    return { success: true, count: upsertData.length };
  } catch (error: unknown) {
    console.error("Error fetching from DigiFlazz", error);
    return { success: false, error: (error as Error).message };
  }
}
