-- Fraud review tracking on scan logs
ALTER TABLE scan_logs
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_scan_logs_fraud ON scan_logs(status, reviewed_at)
  WHERE status IN ('blocked_fraud', 'blocked_limit');
