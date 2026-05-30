-- Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Fix Users Table Policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" 
ON public.users FOR SELECT 
USING (public.is_admin());

-- 2. Fix Products Table Policies
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (public.is_admin());

-- 3. Fix Deposits Table Policies
DROP POLICY IF EXISTS "Admins can manage all deposits" ON public.deposits;
CREATE POLICY "Admins can manage all deposits" 
ON public.deposits FOR ALL 
USING (public.is_admin());

-- 4. Fix Transactions Table Policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR SELECT 
USING (public.is_admin());
