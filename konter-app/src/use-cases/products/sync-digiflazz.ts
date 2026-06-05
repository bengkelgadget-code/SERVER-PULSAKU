import { digiflazz } from '@/infrastructure/digiflazz/client';
import { createAdminClient } from '@/infrastructure/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWithRetry(command: 'prepaid' | 'pasca', maxRetries = 3): Promise<any[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await digiflazz.getPriceList(command);
      
      // DigiFlazz returns { data: [...] } on success or { data: { rc, message } } on error
      const data = res.data;
      if (!Array.isArray(data)) {
        // It's an error object from DigiFlazz (e.g. rate limit)
        const errMsg = (data as { message?: string })?.message || 'Unknown DigiFlazz error';
        console.warn(`[DigiFlazz] ${command} attempt ${attempt}/${maxRetries}: ${errMsg}`);
        
        if (attempt < maxRetries) {
          // Wait before retry: 10s, 20s, 30s
          await new Promise(r => setTimeout(r, attempt * 10000));
          continue;
        }
        return [];
      }
      return data;
    } catch (err) {
      console.error(`[DigiFlazz] ${command} attempt ${attempt} error:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 10000));
      }
    }
  }
  return [];
}

export async function syncDigiFlazzProducts() {
  const supabase = createAdminClient();

  try {
    // Fetch prepaid first, then pasca sequentially to avoid rate limit
    const prepaidProducts = await fetchWithRetry('prepaid');
    
    // Wait 5 seconds between requests to respect DigiFlazz rate limits
    await new Promise(r => setTimeout(r, 5000));
    
    const pascaProducts = await fetchWithRetry('pasca');

    const allProducts = [...prepaidProducts, ...pascaProducts];

    if (allProducts.length === 0) {
      return { success: false, error: 'DigiFlazz membatasi permintaan. Tunggu beberapa menit dan coba lagi.' };
    }

    // Deduplicate by sku_code (keep last occurrence)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueProductsMap = new Map<string, any>();
    for (const p of allProducts) {
      uniqueProductsMap.set(p.buyer_sku_code, p);
    }

    const uniqueProducts = Array.from(uniqueProductsMap.values())
      .filter(p =>
        p.buyer_sku_code &&
        typeof p.buyer_sku_code === 'string' &&
        p.buyer_sku_code.trim() !== '' &&
        p.price !== null &&
        p.price !== undefined &&
        !isNaN(Number(p.price))
      );

    if (uniqueProducts.length === 0) {
      return { success: false, error: 'Semua produk dari DigiFlazz tidak valid (data kosong)' };
    }

    // Get all existing SKUs from database to preserve harga_jual
    const { data: existingProducts } = await supabase
      .from('products')
      .select('sku_code, harga_jual');

    const existingPriceMap = new Map<string, number>();
    if (existingProducts) {
      for (const ep of existingProducts) {
        existingPriceMap.set(ep.sku_code, ep.harga_jual);
      }
    }

    const upsertData = uniqueProducts.map(p => {
      const isActive = p.buyer_product_status === true && p.seller_product_status === true;
      const existingPrice = existingPriceMap.get(p.buyer_sku_code);
      const price = Number(p.price);

      return {
        sku_code: p.buyer_sku_code,
        product_name: p.product_name,
        category: p.category,
        brand: p.brand,
        harga_modal: price,
        // Preserve existing harga_jual; default for new products = modal + 500
        harga_jual: existingPrice ?? Math.max(price + 500, Math.round(price * 1.03)),
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert in chunks of 500
    const CHUNK_SIZE = 500;
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
