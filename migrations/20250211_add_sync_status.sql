-- Add sync status columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS meegle_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (meegle_sync_status IN ('pending', 'success', 'failed')),
ADD COLUMN IF NOT EXISTS meegle_sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_events_sync_status ON events(meegle_sync_status);
