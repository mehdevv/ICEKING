-- Standalone rewards list for client card (works even if card RPC is an older version).

CREATE OR REPLACE FUNCTION public.get_client_rewards_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_lookup TEXT;
BEGIN
  v_lookup := trim(p_token);

  SELECT id INTO v_client_id
  FROM clients
  WHERE (
    card_code = v_lookup
    OR fidelity_qr_token::text = v_lookup
  )
    AND NOT is_blocked;

  IF NOT FOUND THEN
    RETURN '[]'::json;
  END IF;

  RETURN COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'rewardDescription', r.reward_description,
          'createdAt', r.created_at,
          'redeemedAt', r.redeemed_at
        )
        ORDER BY r.created_at DESC
      )
      FROM rewards r
      WHERE r.client_id = v_client_id
    ),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_rewards_by_token(TEXT) TO anon, authenticated;
