-- Client-facing app language (French or English), set from admin dashboard

ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS client_language TEXT NOT NULL DEFAULT 'fr'
  CHECK (client_language IN ('fr', 'en'));
