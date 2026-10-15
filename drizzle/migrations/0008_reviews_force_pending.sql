CREATE OR REPLACE FUNCTION public.reviews_force_pending() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN NEW.is_approved := false;
    ELSIF NEW.rating IS DISTINCT FROM OLD.rating OR NEW.comment IS DISTINCT FROM OLD.comment THEN NEW.is_approved := false;
    ELSE NEW.is_approved := OLD.is_approved;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.reviews_force_pending() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reviews_force_pending BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.reviews_force_pending();