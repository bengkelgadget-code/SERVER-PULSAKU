import { digiflazz } from '@/infrastructure/digiflazz/client';
import { createClient } from '@/infrastructure/supabase/server';
import crypto from 'crypto';

export async function processPurchase(userId: string, skuCode: string, customerNo: string) {
  const supabase = await createClient();

  // 1. Get Product Details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('harga_modal, harga_jual, is_active')
    .eq('sku_code', skuCode)
    .single();

  if (productError || !product) {
    return { success: false, error: 'Product not found' };
  }

  if (!product.is_active) {
    return { success: false, error: 'Product is currently inactive' };
  }

  // 2. Generate Reference ID
  const refId = `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // 3. Transaction Lock (RPC Call)
  // This securely checks balance, deducts it, and creates a pending transaction record.
  const { data: transactionId, error: rpcError } = await supabase.rpc('process_purchase', {
    p_user_id: userId,
    p_amount: product.harga_jual,
    p_sku_code: skuCode,
    p_customer_no: customerNo,
    p_ref_id: refId,
    p_harga_modal: product.harga_modal,
    p_harga_jual: product.harga_jual
  });

  if (rpcError) {
    console.error("RPC Error:", rpcError);
    return { success: false, error: rpcError.message || 'Insufficient balance or server error' };
  }

  // 4. Call DigiFlazz API
  try {
    const response = await digiflazz.createTransaction(skuCode, customerNo, refId);
    
    // 5. Update transaction status based on response
    // DigiFlazz status can be 'Pending', 'Sukses', or 'Gagal'
    const dfStatus = response.data.status.toLowerCase();
    
    // Map DigiFlazz status to our database Enum ('pending', 'sukses', 'gagal')
    let dbStatus = 'pending';
    if (dfStatus === 'sukses') dbStatus = 'sukses';
    if (dfStatus === 'gagal') dbStatus = 'gagal';

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: dbStatus, 
        sn: response.data.sn || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error("Error updating transaction after DigiFlazz call:", updateError);
    }

    // If Gagal, we should ideally refund the user.
    if (dbStatus === 'gagal') {
      // Refund logic: Add balance back
      await supabase.rpc('refund_purchase', { p_transaction_id: transactionId });
      return { success: false, error: `Transaction failed: ${response.data.message}`, status: dbStatus };
    }

    return { success: true, transactionId, status: dbStatus, sn: response.data.sn };

  } catch (error: unknown) {
    console.error("DigiFlazz Transaction Error:", error);
    // If DigiFlazz call fails completely (e.g. timeout), it stays 'pending' 
    // and we wait for the Webhook to update it.
    return { success: true, transactionId, status: 'pending', note: 'Waiting for supplier' };
  }
}
