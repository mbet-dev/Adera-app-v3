-- Create reviews table for product ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read reviews
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY reviews_auth_insert ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own reviews
CREATE POLICY reviews_owner_update ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY reviews_owner_delete ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add average_rating and total_reviews to products table if not exists (already in schema but good to ensure)
-- We can create a function to update product stats on review change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    average_rating = (SELECT AVG(rating) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();
