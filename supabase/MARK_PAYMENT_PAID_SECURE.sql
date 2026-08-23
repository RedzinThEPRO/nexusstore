-- Review and run this migration in Supabase before enabling COMPLETED webhook processing.
CREATE OR REPLACE FUNCTION public.mark_payment_paid_secure(
  p_payment_id uuid,
  p_order_id uuid,
  p_paid_at timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_status payment_status;
  v_order_status payment_status;
BEGIN
  SELECT status INTO v_payment_status
  FROM public.payments
  WHERE id = p_payment_id AND order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_payment_status NOT IN ('PENDING', 'PAID') THEN RETURN false; END IF;

  UPDATE public.payments
  SET status = 'PAID', provider_status = 'COMPLETED', paid_at = p_paid_at, updated_at = now()
  WHERE id = p_payment_id AND status = 'PENDING';

  UPDATE public.orders
  SET payment_status = 'PAID', status = 'PAID', updated_at = now()
  WHERE id = p_order_id AND payment_status IN ('PENDING', 'PAID');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for payment %', p_payment_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_payment_paid_secure(uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_payment_paid_secure(uuid, uuid, timestamptz) TO service_role;
