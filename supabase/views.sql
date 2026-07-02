-- ============================================================
-- SLPL Score Views — superseded by create_tie_breaks.sql
-- Run create_tie_breaks.sql instead — it creates the table,
-- RLS policies, realtime, and both views in one script.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- slpl_set_score_view
-- One row per set. Shows game counts per team + tiebreak scores.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW slpl_set_score_view AS
SELECT
  s.id                                                          AS set_id,
  s.match_id,
  s.set_number,
  s.winner_team_id,
  m.team1_id,
  m.team2_id,

  -- Games won by each team (excludes legacy tiebreak rows)
  COUNT(
    CASE WHEN g.winner_team_id = m.team1_id THEN 1 END
  )                                                             AS team1_games,
  COUNT(
    CASE WHEN g.winner_team_id = m.team2_id THEN 1 END
  )                                                             AS team2_games,

  -- Tiebreak points from slpl_tie_breaks
  tb.team1_tie_points,
  tb.team2_tie_points

FROM slpl_sets s
JOIN  slpl_matches m ON m.id = s.match_id
LEFT JOIN slpl_set_games g
       ON g.set_id = s.id
      AND (g.deleted_at IS NULL)
      AND (g.is_tiebreak_game IS NULL OR g.is_tiebreak_game = FALSE)
LEFT JOIN slpl_tie_breaks tb ON tb.set_id = s.id

WHERE s.deleted_at IS NULL

GROUP BY
  s.id,
  s.match_id,
  s.set_number,
  s.winner_team_id,
  m.team1_id,
  m.team2_id,
  tb.team1_tie_points,
  tb.team2_tie_points;


-- ──────────────────────────────────────────────────────────────
-- slpl_match_score_view
-- One row per match. Shows sets won per team + full set detail.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW slpl_match_score_view AS
SELECT
  m.id                                                           AS match_id,
  m.team1_id,
  m.team2_id,
  m.status,
  m.scheduled_at,
  m.match_category,

  -- Sets won
  COUNT(
    CASE WHEN sv.winner_team_id = m.team1_id THEN 1 END
  )                                                              AS team1_sets,
  COUNT(
    CASE WHEN sv.winner_team_id = m.team2_id THEN 1 END
  )                                                              AS team2_sets,

  -- Full set breakdown as JSON array ordered by set_number
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

FROM slpl_matches m
LEFT JOIN slpl_set_score_view sv ON sv.match_id = m.id

WHERE m.deleted_at IS NULL

GROUP BY
  m.id,
  m.team1_id,
  m.team2_id,
  m.status,
  m.scheduled_at,
  m.match_category;
