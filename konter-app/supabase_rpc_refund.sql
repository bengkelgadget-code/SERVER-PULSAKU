-- RPC: Refund Purchase
CREATE OR REPLACE FUNCTION refund_purchase(p_transaction_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_harga_jual DECIMAL;
  v_status transaction_status;
BEGIN
  -- Get transaction details and lock the row
  SELECT user_id, harga_jual, status INTO v_user_id, v_harga_jual, v_status
  FROM public.transactions 
  WHERE id = p_transaction_id FOR UPDATE;

  -- Ensure we only refund failed or pending transactions that are now being marked as failed
  IF v_status = 'sukses' THEN
    RAISE EXCEPTION 'Cannot refund a successful transaction';
  END IF;

  -- Update user balance
  UPDATE public.users 
  SET saldo = saldo + v_harga_jual 
  WHERE id = v_user_id;

  -- Ensure transaction status is marked as gagal if not already
  UPDATE public.transactions 
  SET status = 'gagal', updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
