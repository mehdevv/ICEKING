-- Per-stamp prizes on fidelity cards: [{ "position": 3, "label": "30% off" }, ...]

ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS stamp_milestones JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Update public card RPC to include milestones
CREATE OR REPLACE FUNCTION public.get_client_card_by_token(p_token UUID)
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
BEGIN
  SELECT * INTO v_client
  FROM clients
  WHERE fidelity_qr_token = p_token
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
    ORDER BY scanned_at DESC
    LIMIT 5
  ) sl;

  RETURN json_build_object(
    'businessName', COALESCE(v_settings.business_name, 'LoyalQR'),
    'clientName', v_client.full_name,
    'primaryColor', COALESCE(v_settings.primary_color, '#1A56DB'),
    'cardUrl', v_client.card_url,
    'cardTemplateUrl', COALESCE(v_settings.card_template_url, '/card-bg.png'),
    'stampThreshold', COALESCE(v_settings.stamp_threshold, 9),
    'currentCycleStamps', v_client.current_cycle_stamps,
    'fidelityQrToken', v_client.fidelity_qr_token,
    'stampMilestones', COALESCE(v_settings.stamp_milestones, '[]'::jsonb),
    'pendingRewardId', v_pending_reward.id,
    'pendingRewardDescription', v_pending_reward.reward_description,
    'recentScans', v_recent_scans
  );
END;
$$;
