-- Client rewards history on card + per-reward claim page.

CREATE OR REPLACE FUNCTION public.get_client_card_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client clients%ROWTYPE;
  v_settings shop_settings%ROWTYPE;
  v_pending_reward rewards%ROWTYPE;
  v_recent_scans JSON;
  v_rewards JSON;
  v_lookup TEXT;
BEGIN
  v_lookup := trim(p_token);

  SELECT * INTO v_client
  FROM clients
  WHERE (
    card_code = v_lookup
    OR fidelity_qr_token::text = v_lookup
  )
    AND NOT is_blocked;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_settings FROM shop_settings LIMIT 1;

  SELECT * INTO v_pending_reward
  FROM rewards
  WHERE client_id = v_client.id
    AND redeemed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'scannedAt', sl.scanned_at,
        'status', sl.status,
        'stampsAdded', sl.stamps_added
      )
      ORDER BY sl.scanned_at DESC
    ),
    '[]'::json
  )
  INTO v_recent_scans
  FROM (
    SELECT scanned_at, status, stamps_added
    FROM scan_logs
    WHERE client_id = v_client.id
      AND scanned_at > (NOW() - INTERVAL '1 hour')
    ORDER BY scanned_at DESC
    LIMIT 5
  ) sl;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', r.id,
        'rewardDescription', r.reward_description,
        'createdAt', r.created_at,
        'redeemedAt', r.redeemed_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::json
  )
  INTO v_rewards
  FROM rewards r
  WHERE r.client_id = v_client.id;

  RETURN json_build_object(
    'businessName', COALESCE(v_settings.business_name, 'LoyalQR'),
    'clientName', v_client.full_name,
    'primaryColor', COALESCE(v_settings.primary_color, '#1A56DB'),
    'cardUrl', v_client.card_url,
    'cardTemplateUrl', COALESCE(v_settings.card_template_url, '/card-bg.png'),
    'stampThreshold', COALESCE(v_settings.stamp_threshold, 9),
    'currentCycleStamps', v_client.current_cycle_stamps,
    'cardCode', v_client.card_code,
    'stampMilestones', COALESCE(v_settings.stamp_milestones, '[]'::jsonb),
    'pendingRewardId', v_pending_reward.id,
    'pendingRewardDescription', v_pending_reward.reward_description,
    'rewards', v_rewards,
    'recentScans', v_recent_scans
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reward_claim_by_id(p_reward_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_client clients%ROWTYPE;
  v_settings shop_settings%ROWTYPE;
BEGIN
  SELECT r.* INTO v_reward
  FROM rewards r
  WHERE r.id = p_reward_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_client
  FROM clients
  WHERE id = v_reward.client_id
    AND NOT is_blocked;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_settings FROM shop_settings LIMIT 1;

  RETURN json_build_object(
    'id', v_reward.id,
    'clientName', v_client.full_name,
    'rewardDescription', v_reward.reward_description,
    'createdAt', v_reward.created_at,
    'redeemedAt', v_reward.redeemed_at,
    'businessName', COALESCE(v_settings.business_name, 'LoyalQR'),
    'primaryColor', COALESCE(v_settings.primary_color, '#1A56DB'),
    'cardCode', v_client.card_code
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reward_claim_by_id(UUID) TO anon, authenticated;
