
-- Add new columns to roadmap_items for Agent Helper
ALTER TABLE public.roadmap_items
  ADD COLUMN IF NOT EXISTS target_bucket text NOT NULL DEFAULT 'Future',
  ADD COLUMN IF NOT EXISTS sprint text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS jira_link text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS feature_type text NOT NULL DEFAULT 'New Feature',
  ADD COLUMN IF NOT EXISTS feature_source text NOT NULL DEFAULT 'Product',
  ADD COLUMN IF NOT EXISTS score_common_customer_ask integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_competitor_market_research integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_seller_prospect_input integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_technical_debt integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_executive_input integer NOT NULL DEFAULT 0;

-- Create scoring_weights table
CREATE TABLE public.scoring_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  product_type text NOT NULL DEFAULT 'Agent Helper',
  w_common_customer_ask integer NOT NULL DEFAULT 30,
  w_competitor_market_research integer NOT NULL DEFAULT 30,
  w_seller_prospect_input integer NOT NULL DEFAULT 15,
  w_technical_debt integer NOT NULL DEFAULT 15,
  w_executive_input integer NOT NULL DEFAULT 10,
  UNIQUE(owner_id, product_type)
);

ALTER TABLE public.scoring_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weights"
  ON public.scoring_weights FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own weights"
  ON public.scoring_weights FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own weights"
  ON public.scoring_weights FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own weights"
  ON public.scoring_weights FOR DELETE
  USING (auth.uid() = owner_id);
