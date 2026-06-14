-- Ice King single-shop loyalty schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shop settings (single row)
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Ice King',
  logo_url TEXT DEFAULT '/logo.jpg',
  card_template_url TEXT DEFAULT '/card-bg.png',
  primary_color TEXT NOT NULL DEFAULT '#1A56DB',
  secondary_color TEXT NOT NULL DEFAULT '#0E9F6E',
  currency TEXT NOT NULL DEFAULT 'DZD',
  timezone TEXT NOT NULL DEFAULT 'Africa/Algiers',
  stamp_threshold INT NOT NULL DEFAULT 9,
  max_scans_per_day INT NOT NULL DEFAULT 2,
  reward_type TEXT NOT NULL DEFAULT 'free_product',
  reward_value TEXT DEFAULT '',
  track_products BOOLEAN NOT NULL DEFAULT true,
  whatsapp_token TEXT,
  whatsapp_phone_id TEXT,
  email_sender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO shop_settings (business_name, logo_url, card_template_url) VALUES ('Ice King', '/logo.jpg', '/card-bg.png');

-- Profiles extend auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'worker')),
  worker_qr_token UUID UNIQUE DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_worker_qr ON profiles(worker_qr_token);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  fidelity_qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  card_url TEXT,
  total_stamps INT NOT NULL DEFAULT 0,
  current_cycle_stamps INT NOT NULL DEFAULT 0,
  total_rewards_earned INT NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_scan_at TIMESTAMPTZ,
  notes TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_fidelity_token ON clients(fidelity_qr_token);
CREATE INDEX idx_clients_search ON clients(full_name, phone, email);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scan logs
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scan_type TEXT NOT NULL DEFAULT 'purchase' CHECK (scan_type IN ('enrolment', 'purchase')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'blocked_fraud', 'blocked_limit')),
  block_reason TEXT,
  stamps_added INT NOT NULL DEFAULT 0,
  reward_triggered BOOLEAN NOT NULL DEFAULT false,
  pending_products BOOLEAN NOT NULL DEFAULT false,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_logs_client ON scan_logs(client_id, scanned_at);
CREATE INDEX idx_scan_logs_worker ON scan_logs(worker_id, scanned_at);
CREATE INDEX idx_scan_logs_status ON scan_logs(status);

-- Scan products
CREATE TABLE scan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_log_id UUID NOT NULL REFERENCES scan_logs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1
);

-- Rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scan_log_id UUID REFERENCES scan_logs(id) ON DELETE SET NULL,
  reward_description TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_client ON rewards(client_id);
CREATE INDEX idx_rewards_status ON rewards(redeemed_at);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  subject TEXT,
  body TEXT NOT NULL,
  recipient_filter JSONB DEFAULT '{"all": true}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Helper: is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner' AND is_active = true);
$$;

-- Helper: is worker
CREATE OR REPLACE FUNCTION public.is_worker()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'worker' AND is_active = true);
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_settings_updated BEFORE UPDATE ON shop_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- shop_settings: public read branding, owner write
CREATE POLICY shop_settings_select ON shop_settings FOR SELECT USING (true);
CREATE POLICY shop_settings_update ON shop_settings FOR UPDATE USING (is_owner());

-- profiles: owner sees all, workers see self
CREATE POLICY profiles_select_owner ON profiles FOR SELECT USING (is_owner() OR id = auth.uid());
CREATE POLICY profiles_insert_owner ON profiles FOR INSERT WITH CHECK (is_owner());
CREATE POLICY profiles_update_owner ON profiles FOR UPDATE USING (is_owner() OR id = auth.uid());
CREATE POLICY profiles_delete_owner ON profiles FOR DELETE USING (is_owner());

-- clients: owner full, worker read for scans
CREATE POLICY clients_select ON clients FOR SELECT USING (is_owner() OR is_worker());
CREATE POLICY clients_insert ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY clients_update ON clients FOR UPDATE USING (is_owner());
CREATE POLICY clients_delete ON clients FOR DELETE USING (is_owner());

-- products
CREATE POLICY products_select ON products FOR SELECT USING (is_owner() OR is_worker());
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (is_owner());
CREATE POLICY products_update ON products FOR UPDATE USING (is_owner());
CREATE POLICY products_delete ON products FOR DELETE USING (is_owner());

-- scan_logs
CREATE POLICY scan_logs_select ON scan_logs FOR SELECT USING (is_owner() OR (is_worker() AND worker_id = auth.uid()));
CREATE POLICY scan_logs_insert ON scan_logs FOR INSERT WITH CHECK (is_owner() OR is_worker());

-- scan_products
CREATE POLICY scan_products_select ON scan_products FOR SELECT USING (is_owner());
CREATE POLICY scan_products_insert ON scan_products FOR INSERT WITH CHECK (is_owner() OR is_worker());

-- rewards
CREATE POLICY rewards_select ON rewards FOR SELECT USING (is_owner() OR is_worker());
CREATE POLICY rewards_update ON rewards FOR UPDATE USING (is_owner() OR is_worker());

-- campaigns
CREATE POLICY campaigns_select ON campaigns FOR SELECT USING (is_owner());
CREATE POLICY campaigns_insert ON campaigns FOR INSERT WITH CHECK (is_owner());
CREATE POLICY campaigns_update ON campaigns FOR UPDATE USING (is_owner());
CREATE POLICY campaigns_delete ON campaigns FOR DELETE USING (is_owner());

-- Storage bucket for shop assets
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY shop_assets_public_read ON storage.objects FOR SELECT USING (bucket_id = 'shop-assets');
CREATE POLICY shop_assets_owner_upload ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop-assets' AND is_owner());
CREATE POLICY shop_assets_owner_update ON storage.objects FOR UPDATE USING (bucket_id = 'shop-assets' AND is_owner());
