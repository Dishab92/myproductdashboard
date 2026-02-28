

# Auto-Approve Admin Email

Update the database trigger `handle_new_user()` so that when a user signs up with the admin email (Disha.bhanot@gmail.com), their profile is automatically created with `approved = true`. All other users remain unapproved and go through the normal approval flow.

## What Changes

**Database migration** -- Modify the `handle_new_user()` trigger function:
- Check if `NEW.email` matches `'disha.bhanot@gmail.com'` (case-insensitive)
- If yes, set `approved = true` on insert
- If no, keep default `approved = false`

This is a single SQL migration -- no frontend code changes needed.

## Technical Detail

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN LOWER(NEW.email) = 'disha.bhanot@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;
```

