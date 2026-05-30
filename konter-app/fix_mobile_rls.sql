-- Fix: Allow anonymous users (and logged in users) to view active products
-- This allows the mobile app catalog to load without requiring login first
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true);
