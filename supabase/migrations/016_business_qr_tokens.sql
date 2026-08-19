-- Add unique QR tracking token to each business
-- Used for physical QR codes at business locations

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS qr_token text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');

-- Backfill existing businesses
UPDATE businesses SET qr_token = encode(gen_random_bytes(6), 'hex') WHERE qr_token IS NULL;

-- Make it non-null after backfill
ALTER TABLE businesses ALTER COLUMN qr_token SET NOT NULL;

-- Index for fast lookups when scanning
CREATE INDEX IF NOT EXISTS idx_businesses_qr_token ON businesses (qr_token);
