
-- Create datasets table (batch metadata)
CREATE TABLE public.datasets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  detected_format text NOT NULL DEFAULT 'standard',
  row_count integer NOT NULL DEFAULT 0,
  date_min timestamptz,
  date_max timestamptz,
  mode text NOT NULL DEFAULT 'append',
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own datasets" ON public.datasets
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own datasets" ON public.datasets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own datasets" ON public.datasets
  FOR DELETE USING (auth.uid() = owner_id);

-- Create events table (persistent event storage)
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key text NOT NULL,
  event_time timestamptz NOT NULL,
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  product text NOT NULL DEFAULT 'Agent Helper',
  user_id text NOT NULL,
  session_id text NOT NULL DEFAULT '',
  event_name text NOT NULL,
  feature text NOT NULL DEFAULT '',
  case_id text,
  channel text,
  metadata_json text,
  dataset_id uuid REFERENCES public.datasets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint on event_key per owner for deduplication
CREATE UNIQUE INDEX idx_events_event_key_owner ON public.events (event_key, owner_id);

-- Index for fast time-range queries
CREATE INDEX idx_events_owner_time ON public.events (owner_id, event_time);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = owner_id);
