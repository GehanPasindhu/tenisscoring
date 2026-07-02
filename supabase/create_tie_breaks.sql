-- ============================================================
-- slpl_tie_breaks — Tiebreak scores per set
-- Run this entire file in the Supabase SQL Editor.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. TABLE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.slpl_tie_breaks (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id          UUID        NOT NULL,
  set_id            UUID        NOT NULL,
  team1_tie_points  INTEGER     NOT NULL DEFAULT 0,
  team2_tie_points  INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- ── Constraints ──────────────────────────────────────────
  -- One tiebreak row per set (a set can only have one tiebreak)
  CONSTRAINT uq_slpl_tie_breaks_set_id UNIQUE (set_id),

  -- Points must be non-negative
  CONSTRAINT chk_team1_tie_points_non_negative CHECK (team1_tie_points >= 0),
  CONSTRAINT chk_team2_tie_points_non_negative CHECK (team2_tie_points >= 0),

  -- ── Foreign keys ─────────────────────────────────────────
  CONSTRAINT fk_tie_breaks_match
    FOREIGN KEY (match_id) REFERENCES public.slpl_matches (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_tie_breaks_set
    FOREIGN KEY (set_id) REFERENCES public.slpl_sets (id)
    ON DELETE CASCADE
);


-- ──────────────────────────────────────────────────────────────
-- 2. INDEXES — fast lookups by set and match
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_slpl_tie_breaks_set_id
  ON public.slpl_tie_breaks (set_id);

CREATE INDEX IF NOT EXISTS idx_slpl_tie_breaks_match_id
  ON public.slpl_tie_breaks (match_id);


-- ──────────────────────────────────────────────────────────────
-- 3. updated_at TRIGGER
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop first to avoid duplicate trigger errors on re-run
DROP TRIGGER IF EXISTS trg_slpl_tie_breaks_updated_at
  ON public.slpl_tie_breaks;

CREATE TRIGGER trg_slpl_tie_breaks_updated_at
  BEFORE UPDATE ON public.slpl_tie_breaks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ──────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.slpl_tie_breaks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tiebreak scores (public scoreboard)
CREATE POLICY "slpl_tie_breaks_select_public"
  ON public.slpl_tie_breaks
  FOR SELECT
  USING (true);

-- Allow authenticated users (refs / admins) to insert tiebreaks
CREATE POLICY "slpl_tie_breaks_insert_authed"
  ON public.slpl_tie_breaks
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow authenticated users to update tiebreaks
CREATE POLICY "slpl_tie_breaks_update_authed"
  ON public.slpl_tie_breaks
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete tiebreaks
CREATE POLICY "slpl_tie_breaks_delete_authed"
  ON public.slpl_tie_breaks
  FOR DELETE
  TO authenticated, anon
  USING (true);


-- ──────────────────────────────────────────────────────────────
-- 5. REALTIME — mobile app subscribes to score changes
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime
  ADD TABLE public.slpl_tie_breaks;


-- ──────────────────────────────────────────────────────────────
-- 6. VIEWS (drop + recreate to pick up the new table)
-- ──────────────────────────────────────────────────────────────

-- slpl_set_score_view: one row per set with game counts + tiebreak scores
CREATE OR REPLACE VIEW public.slpl_set_score_view AS
SELECT
  s.id                                                          AS set_id,
  s.match_id,
  s.set_number,
  s.winner_team_id,
  m.team1_id,
  m.team2_id,

  COUNT(
    CASE WHEN g.winner_team_id = m.team1_id THEN 1 END
  )                                                             AS team1_games,
  COUNT(
    CASE WHEN g.winner_team_id = m.team2_id THEN 1 END
  )                                                             AS team2_games,

  tb.team1_tie_points,
  tb.team2_tie_points

FROM public.slpl_sets s
JOIN  public.slpl_matches m ON m.id = s.match_id

LEFT JOIN public.slpl_set_games g
       ON g.set_id = s.id
      AND (g.deleted_at IS NULL)
      AND (g.is_tiebreak_game IS NULL OR g.is_tiebreak_game = FALSE)

LEFT JOIN public.slpl_tie_breaks tb ON tb.set_id = s.id

WHERE s.deleted_at IS NULL

GROUP BY
  s.id, s.match_id, s.set_number, s.winner_team_id,
  m.team1_id, m.team2_id,
  tb.team1_tie_points, tb.team2_tie_points;


-- slpl_match_score_view: one row per match with set counts + full set breakdown
CREATE OR REPLACE VIEW public.slpl_match_score_view AS
SELECT
  m.id                                                           AS match_id,
  m.team1_id,
  m.team2_id,
  m.status,
  m.scheduled_at,
  m.match_category,

  COUNT(
    CASE WHEN sv.winner_team_id = m.team1_id THEN 1 END
  )                                                              AS team1_sets,
  COUNT(
    CASE WHEN sv.winner_team_id = m.team2_id THEN 1 END
  )                                                              AS team2_sets,

  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'set_number',       sv.set_number,
        'winner_team_id',   sv.winner_team_id,
        'team1_games',      sv.team1_games,
        'team2_games',      sv.team2_games,
        'team1_tie_points', sv.team1_tie_points,
        'team2_tie_points', sv.team2_tie_points
      )
      ORDER BY sv.set_number
    ) FILTER (WHERE sv.set_id IS NOT NULL),
    '[]'::json
  )                                                              AS sets

FROM public.slpl_matches m
LEFT JOIN public.slpl_set_score_view sv ON sv.match_id = m.id

WHERE m.deleted_at IS NULL

GROUP BY
  m.id, m.team1_id, m.team2_id,
  m.status, m.scheduled_at, m.match_category;


-- ──────────────────────────────────────────────────────────────
-- Done. Verify with:
--   SELECT * FROM slpl_tie_breaks LIMIT 5;
--   SELECT * FROM slpl_set_score_view LIMIT 5;
--   SELECT * FROM slpl_match_score_view LIMIT 5;
-- ──────────────────────────────────────────────────────────────
