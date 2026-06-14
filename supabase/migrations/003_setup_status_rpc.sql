-- Allow anonymous clients to detect whether initial owner setup is complete.
-- RLS blocks direct profile reads for anon; this RPC runs as definer and only returns a boolean.

CREATE OR REPLACE FUNCTION public.is_owner_setup_complete()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE role = 'owner');
$$;

REVOKE ALL ON FUNCTION public.is_owner_setup_complete() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner_setup_complete() TO anon, authenticated;
