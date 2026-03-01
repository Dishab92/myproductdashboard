
-- 1. Create enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 6. Seed Disha as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'disha.bhanot@gmail.com';

-- 7. Update handle_new_user to auto-assign moderator
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN LOWER(NEW.email) = 'disha.bhanot@gmail.com' THEN true ELSE false END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'moderator');
  RETURN NEW;
END;
$function$;

-- 8. Update roadmap_items RLS: drop old, create new
DROP POLICY IF EXISTS "Users can view own roadmap items" ON public.roadmap_items;
DROP POLICY IF EXISTS "Users can insert own roadmap items" ON public.roadmap_items;
DROP POLICY IF EXISTS "Users can update own roadmap items" ON public.roadmap_items;
DROP POLICY IF EXISTS "Users can delete own roadmap items" ON public.roadmap_items;

CREATE POLICY "Authenticated users can view all roadmap items"
ON public.roadmap_items FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert roadmap items"
ON public.roadmap_items FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roadmap items"
ON public.roadmap_items FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roadmap items"
ON public.roadmap_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Update scoring_weights RLS
DROP POLICY IF EXISTS "Users can view own weights" ON public.scoring_weights;
DROP POLICY IF EXISTS "Users can insert own weights" ON public.scoring_weights;
DROP POLICY IF EXISTS "Users can update own weights" ON public.scoring_weights;
DROP POLICY IF EXISTS "Users can delete own weights" ON public.scoring_weights;

CREATE POLICY "Authenticated users can view all weights"
ON public.scoring_weights FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert weights"
ON public.scoring_weights FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update weights"
ON public.scoring_weights FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete weights"
ON public.scoring_weights FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
