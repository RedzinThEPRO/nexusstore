-- Atomic EvoPay payment confirmation and reconciliation coordination.
-- Run this migration in Supabase before enabling the webhook/reconciliation worker.

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
  v_payment public.payments%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  -- Lock in a stable order so concurrent webhook/reconciliation calls serialize.
  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id AND order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for payment %', p_payment_id USING ERRCODE = 'P0002';
  END IF;

  -- A previously completed call is idempotent, but repair an older inconsistent
  -- order state while holding both row locks.
  IF v_payment.status = 'PAID' THEN
    IF v_order.payment_status <> 'PAID' OR v_order.status <> 'PAID' THEN
      UPDATE public.orders
      SET payment_status = 'PAID', status = 'PAID', updated_at = now()
      WHERE id = p_order_id;
    END IF;
    RETURN true;
  END IF;

  IF v_payment.status <> 'PENDING' THEN RETURN false; END IF;

  UPDATE public.payments
  SET status = 'PAID', provider_status = 'COMPLETED', paid_at = COALESCE(p_paid_at, now()), updated_at = now()
  WHERE id = p_payment_id;

  UPDATE public.orders
  SET payment_status = 'PAID', status = 'PAID', updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_payment_paid_secure(uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_payment_paid_secure(uuid, uuid, timestamptz) TO service_role;

CREATE TABLE IF NOT EXISTS public.payment_reconciliation_state (
  payment_id uuid PRIMARY KEY REFERENCES public.payments(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.claim_payment_reconciliation(
  p_payment_id uuid,
  p_min_interval interval DEFAULT interval '5 minutes',
  p_max_attempts integer DEFAULT 3
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_status payment_status;
  v_state public.payment_reconciliation_state%ROWTYPE;
BEGIN
  SELECT status INTO v_payment_status FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND OR v_payment_status <> 'PENDING' THEN RETURN false; END IF;

  INSERT INTO public.payment_reconciliation_state(payment_id)
  VALUES (p_payment_id)
  ON CONFLICT (payment_id) DO NOTHING;
  SELECT * INTO v_state FROM public.payment_reconciliation_state WHERE payment_id = p_payment_id FOR UPDATE;

  IF v_state.attempts >= p_max_attempts
     OR (v_state.last_attempt_at IS NOT NULL AND v_state.last_attempt_at > now() - p_min_interval)
     OR (v_state.locked_at IS NOT NULL AND v_state.locked_at > now() - interval '15 minutes') THEN
    RETURN false;
  END IF;
  UPDATE public.payment_reconciliation_state
  SET attempts = attempts + 1, last_attempt_at = now(), locked_at = now(), updated_at = now()
  WHERE payment_id = p_payment_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_reconciliation(uuid, interval, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_payment_reconciliation(uuid, interval, integer) TO service_role;
