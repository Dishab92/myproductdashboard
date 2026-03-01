
-- Create roadmap_items table
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  product_type text NOT NULL DEFAULT 'Agent Helper',
  category text NOT NULL DEFAULT 'Feature',
  priority text NOT NULL DEFAULT 'P1',
  status text NOT NULL DEFAULT 'Backlog',
  release_quarter text,
  target_date date,
  owner text NOT NULL DEFAULT '',
  customer_visibility text NOT NULL DEFAULT 'Internal',
  linked_customers text[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own roadmap items"
  ON public.roadmap_items FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own roadmap items"
  ON public.roadmap_items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own roadmap items"
  ON public.roadmap_items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own roadmap items"
  ON public.roadmap_items FOR DELETE
  USING (auth.uid() = owner_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_roadmap_updated_at();
