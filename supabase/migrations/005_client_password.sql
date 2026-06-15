-- Client phone + password auth (signup / login on /client)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_phone_unique
  ON clients (phone)
  WHERE phone IS NOT NULL AND phone <> '';
