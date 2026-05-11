-- ═══════════════════════════════════════════════════════════════════
-- Begin Forever — Safety & Account Lifecycle Migration
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- BEFORE running: Dashboard → Database → Backups → "Take backup"
-- ═══════════════════════════════════════════════════════════════════

-- 1. Lifecycle timestamps on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;

-- 2. BLOCKS table
CREATE TABLE IF NOT EXISTS user_blocks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);

-- 3. REPORTS table
CREATE TABLE IF NOT EXISTS user_reports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT DEFAULT 'open',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON user_reports(reported_id);

-- 4. Row-Level Security
ALTER TABLE user_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_blocks_select" ON user_blocks;
CREATE POLICY "own_blocks_select" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "own_blocks_insert" ON user_blocks;
CREATE POLICY "own_blocks_insert" ON user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "own_blocks_delete" ON user_blocks;
CREATE POLICY "own_blocks_delete" ON user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "own_reports_select" ON user_reports;
CREATE POLICY "own_reports_select" ON user_reports
  FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "own_reports_insert" ON user_reports;
CREATE POLICY "own_reports_insert" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "admin_reports_update" ON user_reports;
CREATE POLICY "admin_reports_update" ON user_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 5. Verify
SELECT 'user_blocks' AS info, COUNT(*)::text AS rows FROM user_blocks
UNION ALL
SELECT 'user_reports', COUNT(*)::text FROM user_reports;
