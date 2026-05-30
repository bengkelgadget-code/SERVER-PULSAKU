-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Types
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'staff');

-- Drop old enum if exists and recreate
DROP TYPE IF EXISTS transaction_status;
DROP TYPE IF EXISTS deposit_status;
CREATE TYPE transaction_status AS ENUM ('pending', 'sukses', 'gagal');
CREATE TYPE deposit_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create Users Table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  saldo DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  nama_toko TEXT,
  admin_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Super admins and admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
  )
);

-- Only superadmin can manage users (change role, delete, etc)
CREATE POLICY "Super admins can manage users"
ON public.users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Trigger to create user profile after auth signup
-- Default role is 'staff' (lowest privilege)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, saldo)
  VALUES (new.id, new.email, 'staff', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create Products Table
CREATE TABLE public.products (
  sku_code TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  harga_modal DECIMAL(12, 2) NOT NULL,
  harga_jual DECIMAL(12, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can view active products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins and superadmins can view/edit all products
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- 4. Create Deposits Table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status deposit_status DEFAULT 'pending',
  bukti_transfer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
ON public.deposits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits"
ON public.deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deposits"
ON public.deposits FOR UPDATE
USING (auth.uid() = user_id);

-- Admins and superadmins can manage all deposits
CREATE POLICY "Admins can manage all deposits"
ON public.deposits FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- 5. Create Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sku_code TEXT REFERENCES public.products(sku_code),
  customer_no TEXT NOT NULL,
  ref_id TEXT UNIQUE NOT NULL,
  harga_modal DECIMAL(12, 2) NOT NULL,
  harga_jual DECIMAL(12, 2) NOT NULL,
  status transaction_status DEFAULT 'pending',
  sn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Only admins and superadmins can insert transactions (server-side only)
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- 6. RPC: Atomic Transaction Lock (Process Purchase)
CREATE OR REPLACE FUNCTION process_purchase(
  p_user_id UUID,
  p_amount DECIMAL,
  p_sku_code TEXT,
  p_customer_no TEXT,
  p_ref_id TEXT,
  p_harga_modal DECIMAL,
  p_harga_jual DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_saldo DECIMAL;
BEGIN
  -- Lock the user row for update to prevent race conditions
  SELECT saldo INTO v_saldo FROM public.users WHERE id = p_user_id FOR UPDATE;

  -- Check if balance is sufficient
  IF v_saldo >= p_amount THEN
    -- Deduct balance
    UPDATE public.users SET saldo = saldo - p_amount WHERE id = p_user_id;

    -- Insert pending transaction
    INSERT INTO public.transactions (user_id, sku_code, customer_no, ref_id, harga_modal, harga_jual, status)
    VALUES (p_user_id, p_sku_code, p_customer_no, p_ref_id, p_harga_modal, p_harga_jual, 'pending')
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
  ELSE
    -- Insufficient balance
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Add Balance (Admin/Super Admin only)
CREATE OR REPLACE FUNCTION add_balance(
  p_user_id UUID,
  p_amount DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  -- Check caller role
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();

  -- Only admins and superadmins can add balance
  IF v_caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized: insufficient privileges';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Update balance
  UPDATE public.users SET saldo = saldo + p_amount WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Update User Role (Super Admin only)
CREATE OR REPLACE FUNCTION update_user_role(
  p_target_user_id UUID,
  p_new_role user_role
) RETURNS VOID AS $$
DECLARE
  v_caller_role user_role;
BEGIN
  -- Check caller role
  SELECT role INTO v_caller_role FROM public.users WHERE id = auth.uid();

  -- Only superadmin can change roles
  IF v_caller_role != 'superadmin' THEN
    RAISE EXCEPTION 'Unauthorized: only superadmin can change user roles';
  END IF;

  -- Super admin cannot demote themselves
  IF p_target_user_id = auth.uid() AND p_new_role != 'superadmin' THEN
    RAISE EXCEPTION 'Cannot demote your own superadmin role';
  END IF;

  -- Update role
  UPDATE public.users SET role = p_new_role WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Refund Purchase (on transaction failure)
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

  -- Only refund if not already successful
  IF v_status = 'sukses' THEN
    RAISE EXCEPTION 'Cannot refund a successful transaction';
  END IF;

  -- Return balance to user
  UPDATE public.users
  SET saldo = saldo + v_harga_jual
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Helper: is_admin (includes superadmin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
