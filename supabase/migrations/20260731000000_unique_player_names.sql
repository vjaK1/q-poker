-- Player names are unique, case- and whitespace-insensitively (decided
-- 2026-07-31 after duplicate profiles forked three players' histories
-- mid-session). The app checks first with a friendly message; this index is
-- the database backstop. Genuinely different same-named humans get an
-- initial ("Dave M", "Dave K").
--
-- Run AFTER repair-2026-07-31-merge-duplicate-players.sql, or creation will
-- fail on the existing duplicates.
create unique index players_name_unique_idx on players (lower(trim(name)));
