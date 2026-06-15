-- One-time fix if 005 failed on duplicate phone (e.g. 0556074842)
-- Run this in Supabase SQL Editor, then re-run 005_client_password.sql if needed.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;

UPDATE clients
SET phone = regexp_replace(trim(phone), '\s+', '', 'g')
WHERE phone IS NOT NULL;

-- See duplicates before fixing:
-- SELECT phone, count(*) FROM clients WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1;

WITH ranked AS (
  SELECT
    id,
    phone,
    ROW_NUMBER() OVER (
      PARTITION BY phone
      ORDER BY enrolled_at ASC, created_at ASC
    ) AS rn
  FROM clients
  WHERE phone IS NOT NULL AND phone <> ''
)
UPDATE clients AS c
SET phone = NULL
FROM ranked AS r
WHERE c.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_phone_unique
  ON clients (phone)
  WHERE phone IS NOT NULL AND phone <> '';
