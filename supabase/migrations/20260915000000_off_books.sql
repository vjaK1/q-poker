-- Q.Poker: "off the books" sessions (spec §4.11, 2026-09-15).
-- A house game run through the app that must not count towards the Board or
-- anyone's stats. Every existing session stays on the books (default false).
-- Only the sessions table changes; transactions stay append-only and untouched.
-- The existing sessions_update policy and grant already allow flipping it.

alter table sessions add column off_books boolean not null default false;
