-- Gamescore schema — run this against your MySQL database (e.g. via phpMyAdmin).

CREATE TABLE credentials (
  username   VARCHAR(64) PRIMARY KEY,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('umpire', 'referee') NOT NULL,
  full_name  VARCHAR(255) NOT NULL
);

CREATE TABLE teams (
  id         VARCHAR(64) PRIMARY KEY,
  team_name  VARCHAR(255) NOT NULL,
  logo       VARCHAR(255) NOT NULL DEFAULT '',
  color      VARCHAR(16) NOT NULL DEFAULT '#f97316'
);

CREATE TABLE matches (
  id              VARCHAR(64) PRIMARY KEY,
  court           INT NOT NULL,
  match_category  VARCHAR(64) NOT NULL,
  match_stage     VARCHAR(64) NOT NULL DEFAULT 'group',
  match_status    ENUM('scheduled', 'live', 'completed') NOT NULL DEFAULT 'scheduled',
  team1_id        VARCHAR(64) NOT NULL,
  team2_id        VARCHAR(64) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE players (
  player_id         VARCHAR(64) PRIMARY KEY,
  match_id          VARCHAR(64) NOT NULL,
  team_id           VARCHAR(64) NOT NULL,
  first_name        VARCHAR(128) NOT NULL,
  last_name         VARCHAR(128) NOT NULL DEFAULT '',
  aces              INT NOT NULL DEFAULT 0,
  double_faults     INT NOT NULL DEFAULT 0,
  winners           INT NOT NULL DEFAULT 0,
  unforced_errors   INT NOT NULL DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE sets (
  id                VARCHAR(64) PRIMARY KEY,
  match_id          VARCHAR(64) NOT NULL,
  set_number        INT NOT NULL,
  winner_team_id    VARCHAR(64),
  tiebreak_team1    INT,
  tiebreak_team2    INT,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE games (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  set_id            VARCHAR(64) NOT NULL,
  game_number       INT NOT NULL,
  winner_team_id    VARCHAR(64),
  team1_points      VARCHAR(16),
  team2_points      VARCHAR(16),
  is_golden_point   BOOLEAN NOT NULL DEFAULT FALSE,
  server_name       VARCHAR(255),
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

-- ─── Seed data (mirrors the previous in-memory mock data) ────────────────────

INSERT INTO credentials (username, password, role, full_name) VALUES
  ('umpire', 'umpire@2026', 'umpire', 'Court Umpire'),
  ('referee', 'refree@26', 'referee', 'Match Referee');