-- Q.Poker historical backfill: 2026-01-16 through 2026-06-12
-- Generated from history.csv. Buy-ins are synthesized ($10 base, rounded up
-- to the nearest $10 for losses) so that cash_out - buy_in reproduces the
-- recorded net EXACTLY. Rebuy counts and seat times are therefore
-- approximations, not the real historical events of those nights.
--
-- RUN ONCE. Sessions/transactions are not idempotent (unlike the player
-- inserts below) -- re-running this would duplicate all 28 nights. Wrapped
-- in a transaction so a failure partway through rolls back cleanly instead
-- of leaving a half-imported history.

begin;

-- 1) Players: idempotent, only inserts names that do not already exist.
insert into players (name, is_guest) select 'Derek', false where not exists (select 1 from players where name = 'Derek');
insert into players (name, is_guest) select 'Ray', false where not exists (select 1 from players where name = 'Ray');
insert into players (name, is_guest) select 'Doug', false where not exists (select 1 from players where name = 'Doug');
insert into players (name, is_guest) select 'DK', false where not exists (select 1 from players where name = 'DK');
insert into players (name, is_guest) select 'Nathan', false where not exists (select 1 from players where name = 'Nathan');
insert into players (name, is_guest) select 'Jack', true where not exists (select 1 from players where name = 'Jack');
insert into players (name, is_guest) select 'AT', false where not exists (select 1 from players where name = 'AT');
insert into players (name, is_guest) select 'Francis', false where not exists (select 1 from players where name = 'Francis');
insert into players (name, is_guest) select 'Riley', false where not exists (select 1 from players where name = 'Riley');
insert into players (name, is_guest) select 'Scott', false where not exists (select 1 from players where name = 'Scott');
insert into players (name, is_guest) select 'Henry Lei', false where not exists (select 1 from players where name = 'Henry Lei');
insert into players (name, is_guest) select 'Sauce', false where not exists (select 1 from players where name = 'Sauce');
insert into players (name, is_guest) select 'Adi', false where not exists (select 1 from players where name = 'Adi');
insert into players (name, is_guest) select 'Ken', false where not exists (select 1 from players where name = 'Ken');
insert into players (name, is_guest) select 'Fane', false where not exists (select 1 from players where name = 'Fane');
insert into players (name, is_guest) select 'Sam G', false where not exists (select 1 from players where name = 'Sam G');
insert into players (name, is_guest) select 'Mitch', false where not exists (select 1 from players where name = 'Mitch');
insert into players (name, is_guest) select 'Vincent', false where not exists (select 1 from players where name = 'Vincent');
insert into players (name, is_guest) select 'David K', false where not exists (select 1 from players where name = 'David K');
insert into players (name, is_guest) select 'Jason B', false where not exists (select 1 from players where name = 'Jason B');
insert into players (name, is_guest) select 'Sam Abraham', false where not exists (select 1 from players where name = 'Sam Abraham');
insert into players (name, is_guest) select 'Victor J', false where not exists (select 1 from players where name = 'Victor J');
insert into players (name, is_guest) select 'Wilson', false where not exists (select 1 from players where name = 'Wilson');
insert into players (name, is_guest) select 'Hamish', false where not exists (select 1 from players where name = 'Hamish');
insert into players (name, is_guest) select 'Josh', false where not exists (select 1 from players where name = 'Josh');
insert into players (name, is_guest) select 'Ally', false where not exists (select 1 from players where name = 'Ally');
insert into players (name, is_guest) select 'Danny', false where not exists (select 1 from players where name = 'Danny');
insert into players (name, is_guest) select 'Alec N', false where not exists (select 1 from players where name = 'Alec N');
insert into players (name, is_guest) select 'Sanjay', false where not exists (select 1 from players where name = 'Sanjay');
insert into players (name, is_guest) select 'Devin', false where not exists (select 1 from players where name = 'Devin');
insert into players (name, is_guest) select 'Bianca', false where not exists (select 1 from players where name = 'Bianca');
insert into players (name, is_guest) select 'Branden', false where not exists (select 1 from players where name = 'Branden');
insert into players (name, is_guest) select 'Alex T', false where not exists (select 1 from players where name = 'Alex T');
insert into players (name, is_guest) select 'Danu', false where not exists (select 1 from players where name = 'Danu');
insert into players (name, is_guest) select 'Om', false where not exists (select 1 from players where name = 'Om');
insert into players (name, is_guest) select 'Alvin', false where not exists (select 1 from players where name = 'Alvin');

-- 2) Sessions + transactions, one block per night.

-- 16-Jan-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-01-16 19:00:00 Australia/Melbourne'::timestamptz, '2026-01-16 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Derek', 'buy_in', 1000, '2026-01-16 19:00:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-01-16 19:05:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 460, '2026-01-16 22:00:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-01-16 19:02:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 2350, '2026-01-16 22:02:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-01-16 19:04:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-01-16 19:09:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-01-16 19:14:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 0, '2026-01-16 22:04:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-01-16 19:06:00 Australia/Melbourne'),
  ('DK', 'cash_out', 8110, '2026-01-16 22:06:00 Australia/Melbourne'),
  ('Nathan', 'buy_in', 1000, '2026-01-16 19:08:00 Australia/Melbourne'),
  ('Nathan', 'rebuy', 1000, '2026-01-16 19:13:00 Australia/Melbourne'),
  ('Nathan', 'cash_out', 0, '2026-01-16 22:08:00 Australia/Melbourne'),
  ('Jack', 'buy_in', 1000, '2026-01-16 19:10:00 Australia/Melbourne'),
  ('Jack', 'rebuy', 1000, '2026-01-16 19:15:00 Australia/Melbourne'),
  ('Jack', 'cash_out', 80, '2026-01-16 22:10:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 23-Jan-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-01-23 19:00:00 Australia/Melbourne'::timestamptz, '2026-01-23 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-01-23 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 450, '2026-01-23 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-01-23 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 4790, '2026-01-23 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-01-23 19:04:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-01-23 19:09:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 520, '2026-01-23 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-01-23 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 1890, '2026-01-23 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-01-23 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3210, '2026-01-23 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-01-23 19:10:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 140, '2026-01-23 22:10:00 Australia/Melbourne'),
  ('Scott', 'buy_in', 1000, '2026-01-23 19:12:00 Australia/Melbourne'),
  ('Scott', 'cash_out', 0, '2026-01-23 22:12:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-01-23 19:14:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-01-23 22:14:00 Australia/Melbourne'),
  ('Henry Lei', 'buy_in', 1000, '2026-01-23 19:16:00 Australia/Melbourne'),
  ('Henry Lei', 'rebuy', 1000, '2026-01-23 19:21:00 Australia/Melbourne'),
  ('Henry Lei', 'cash_out', 0, '2026-01-23 22:16:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 6-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-06 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-06 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-02-06 19:00:00 Australia/Melbourne'),
  ('Sauce', 'rebuy', 1000, '2026-02-06 19:05:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 740, '2026-02-06 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-02-06 19:02:00 Australia/Melbourne'),
  ('AT', 'cash_out', 4080, '2026-02-06 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-06 19:04:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 3650, '2026-02-06 22:04:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-02-06 19:06:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 1890, '2026-02-06 22:06:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-02-06 19:08:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-02-06 19:13:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-02-06 19:18:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-02-06 19:23:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-02-06 22:08:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-06 19:10:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-06 19:15:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-06 19:20:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-06 19:25:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-06 19:30:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 0, '2026-02-06 22:10:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-06 19:12:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 4120, '2026-02-06 22:12:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-06 19:14:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-06 19:19:00 Australia/Melbourne'),
  ('DK', 'cash_out', 780, '2026-02-06 22:14:00 Australia/Melbourne'),
  ('Adi', 'buy_in', 1000, '2026-02-06 19:16:00 Australia/Melbourne'),
  ('Adi', 'cash_out', 2740, '2026-02-06 22:16:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 11-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-11 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-11 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-02-11 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 6270, '2026-02-11 22:00:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-02-11 19:02:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-02-11 22:02:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-11 19:04:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-11 19:09:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-11 19:14:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-02-11 19:19:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 960, '2026-02-11 22:04:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-11 19:06:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-11 19:11:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 90, '2026-02-11 22:06:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-02-11 19:08:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 0, '2026-02-11 22:08:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-02-11 19:10:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 1590, '2026-02-11 22:10:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-11 19:12:00 Australia/Melbourne'),
  ('DK', 'cash_out', 1440, '2026-02-11 22:12:00 Australia/Melbourne'),
  ('Sam G', 'buy_in', 1000, '2026-02-11 19:14:00 Australia/Melbourne'),
  ('Sam G', 'cash_out', 1650, '2026-02-11 22:14:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 12-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-12 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-12 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-02-12 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 900, '2026-02-12 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-02-12 19:02:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-02-12 19:07:00 Australia/Melbourne'),
  ('AT', 'cash_out', 770, '2026-02-12 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-12 19:04:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 2910, '2026-02-12 22:04:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-12 19:06:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-12 19:11:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 0, '2026-02-12 22:06:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-12 19:08:00 Australia/Melbourne'),
  ('DK', 'cash_out', 2420, '2026-02-12 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 13-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-13 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-13 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-02-13 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-02-13 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-13 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 3210, '2026-02-13 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-02-13 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 4660, '2026-02-13 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-02-13 19:06:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-02-13 19:11:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-02-13 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-13 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3110, '2026-02-13 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-13 19:10:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-13 19:15:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 0, '2026-02-13 22:10:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-13 19:12:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-13 19:17:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-13 19:22:00 Australia/Melbourne'),
  ('DK', 'cash_out', 60, '2026-02-13 22:12:00 Australia/Melbourne'),
  ('Adi', 'buy_in', 1000, '2026-02-13 19:14:00 Australia/Melbourne'),
  ('Adi', 'cash_out', 960, '2026-02-13 22:14:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 19-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-19 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-19 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-02-19 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 650, '2026-02-19 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-02-19 19:02:00 Australia/Melbourne'),
  ('AT', 'cash_out', 570, '2026-02-19 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-19 19:04:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-02-19 19:09:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-02-19 22:04:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-19 19:06:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 2000, '2026-02-19 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-19 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 1320, '2026-02-19 22:08:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-19 19:10:00 Australia/Melbourne'),
  ('DK', 'cash_out', 2750, '2026-02-19 22:10:00 Australia/Melbourne'),
  ('Adi', 'buy_in', 1000, '2026-02-19 19:12:00 Australia/Melbourne'),
  ('Adi', 'cash_out', 710, '2026-02-19 22:12:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 20-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-20 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-20 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Mitch', 'buy_in', 1000, '2026-02-20 19:00:00 Australia/Melbourne'),
  ('Mitch', 'cash_out', 1810, '2026-02-20 22:00:00 Australia/Melbourne'),
  ('Sauce', 'buy_in', 1000, '2026-02-20 19:02:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 1030, '2026-02-20 22:02:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-02-20 19:04:00 Australia/Melbourne'),
  ('AT', 'cash_out', 3780, '2026-02-20 22:04:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-20 19:06:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-02-20 19:11:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-02-20 22:06:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-02-20 19:08:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 6380, '2026-02-20 22:08:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-02-20 19:10:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-02-20 19:15:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 230, '2026-02-20 22:10:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-20 19:12:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 4470, '2026-02-20 22:12:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-20 19:14:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 240, '2026-02-20 22:14:00 Australia/Melbourne'),
  ('Scott', 'buy_in', 1000, '2026-02-20 19:16:00 Australia/Melbourne'),
  ('Scott', 'cash_out', 1150, '2026-02-20 22:16:00 Australia/Melbourne'),
  ('Vincent', 'buy_in', 1000, '2026-02-20 19:18:00 Australia/Melbourne'),
  ('Vincent', 'cash_out', 0, '2026-02-20 22:18:00 Australia/Melbourne'),
  ('David K', 'buy_in', 1000, '2026-02-20 19:20:00 Australia/Melbourne'),
  ('David K', 'cash_out', 0, '2026-02-20 22:20:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-02-20 19:22:00 Australia/Melbourne'),
  ('Fane', 'rebuy', 1000, '2026-02-20 19:27:00 Australia/Melbourne'),
  ('Fane', 'rebuy', 1000, '2026-02-20 19:32:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 910, '2026-02-20 22:22:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-20 19:24:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-20 19:29:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-20 19:34:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-02-20 19:39:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-02-20 22:24:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 27-Feb-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-02-27 19:00:00 Australia/Melbourne'::timestamptz, '2026-02-27 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Mitch', 'buy_in', 1000, '2026-02-27 19:00:00 Australia/Melbourne'),
  ('Mitch', 'rebuy', 1000, '2026-02-27 19:05:00 Australia/Melbourne'),
  ('Mitch', 'rebuy', 1000, '2026-02-27 19:10:00 Australia/Melbourne'),
  ('Mitch', 'cash_out', 0, '2026-02-27 22:00:00 Australia/Melbourne'),
  ('Sauce', 'buy_in', 1000, '2026-02-27 19:02:00 Australia/Melbourne'),
  ('Sauce', 'rebuy', 1000, '2026-02-27 19:07:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 600, '2026-02-27 22:02:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-02-27 19:04:00 Australia/Melbourne'),
  ('AT', 'cash_out', 1440, '2026-02-27 22:04:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-02-27 19:06:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 490, '2026-02-27 22:06:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-02-27 19:08:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-02-27 19:13:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-02-27 19:18:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-02-27 19:23:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 470, '2026-02-27 22:08:00 Australia/Melbourne'),
  ('Jason B', 'buy_in', 1000, '2026-02-27 19:10:00 Australia/Melbourne'),
  ('Jason B', 'cash_out', 1560, '2026-02-27 22:10:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-02-27 19:12:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 1000, '2026-02-27 22:12:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-02-27 19:14:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-27 19:19:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-27 19:24:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-02-27 19:29:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 70, '2026-02-27 22:14:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-02-27 19:16:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 1000, '2026-02-27 22:16:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-02-27 19:18:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 3800, '2026-02-27 22:18:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-02-27 19:20:00 Australia/Melbourne'),
  ('DK', 'cash_out', 6610, '2026-02-27 22:20:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-02-27 19:22:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 0, '2026-02-27 22:22:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-02-27 19:24:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 3960, '2026-02-27 22:24:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-02-27 19:26:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 2000, '2026-02-27 22:26:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 5-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-05 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-05 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-03-05 19:00:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-03-05 19:05:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-03-05 19:10:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-03-05 19:15:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-03-05 19:20:00 Australia/Melbourne'),
  ('AT', 'cash_out', 140, '2026-03-05 22:00:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-05 19:02:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 2790, '2026-03-05 22:02:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-05 19:04:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 4070, '2026-03-05 22:04:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-03-05 19:06:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 1000, '2026-03-05 22:06:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-03-05 19:08:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 1000, '2026-03-05 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 6-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-06 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-06 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-03-06 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 500, '2026-03-06 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-03-06 19:02:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-03-06 19:07:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-03-06 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-03-06 19:04:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-03-06 19:09:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-03-06 22:04:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-03-06 19:06:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 1000, '2026-03-06 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-06 19:08:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-03-06 19:13:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-03-06 19:18:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 0, '2026-03-06 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-06 19:10:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-03-06 19:15:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-03-06 19:20:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-03-06 19:25:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 850, '2026-03-06 22:10:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-03-06 19:12:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 510, '2026-03-06 22:12:00 Australia/Melbourne'),
  ('David K', 'buy_in', 1000, '2026-03-06 19:14:00 Australia/Melbourne'),
  ('David K', 'cash_out', 3200, '2026-03-06 22:14:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-03-06 19:16:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 0, '2026-03-06 22:16:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-03-06 19:18:00 Australia/Melbourne'),
  ('DK', 'cash_out', 11830, '2026-03-06 22:18:00 Australia/Melbourne'),
  ('Adi', 'buy_in', 1000, '2026-03-06 19:20:00 Australia/Melbourne'),
  ('Adi', 'cash_out', 1000, '2026-03-06 22:20:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-03-06 19:22:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 1110, '2026-03-06 22:22:00 Australia/Melbourne'),
  ('Hamish', 'buy_in', 1000, '2026-03-06 19:24:00 Australia/Melbourne'),
  ('Hamish', 'cash_out', 0, '2026-03-06 22:24:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 13-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-13 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-13 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-03-13 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 1840, '2026-03-13 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-03-13 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 710, '2026-03-13 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-03-13 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 2350, '2026-03-13 22:04:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-13 19:06:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 0, '2026-03-13 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-13 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 2020, '2026-03-13 22:08:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-03-13 19:10:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 210, '2026-03-13 22:10:00 Australia/Melbourne'),
  ('David K', 'buy_in', 1000, '2026-03-13 19:12:00 Australia/Melbourne'),
  ('David K', 'cash_out', 0, '2026-03-13 22:12:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-03-13 19:14:00 Australia/Melbourne'),
  ('Fane', 'rebuy', 1000, '2026-03-13 19:19:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 920, '2026-03-13 22:14:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-03-13 19:16:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-13 19:21:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-13 19:26:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-03-13 22:16:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-03-13 19:18:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 4950, '2026-03-13 22:18:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 20-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-20 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-20 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-03-20 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 4230, '2026-03-20 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-03-20 19:02:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-03-20 19:07:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-03-20 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-03-20 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 440, '2026-03-20 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-03-20 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 5190, '2026-03-20 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-20 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 10410, '2026-03-20 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-20 19:10:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-03-20 19:15:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-03-20 19:20:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 310, '2026-03-20 22:10:00 Australia/Melbourne'),
  ('David K', 'buy_in', 1000, '2026-03-20 19:12:00 Australia/Melbourne'),
  ('David K', 'cash_out', 1140, '2026-03-20 22:12:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-03-20 19:14:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 1970, '2026-03-20 22:14:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-03-20 19:16:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-20 19:21:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-20 19:26:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-20 19:31:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-03-20 19:36:00 Australia/Melbourne'),
  ('DK', 'cash_out', 780, '2026-03-20 22:16:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-03-20 19:18:00 Australia/Melbourne'),
  ('Sam Abraham', 'rebuy', 1000, '2026-03-20 19:23:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 0, '2026-03-20 22:18:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-03-20 19:20:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:25:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:30:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:35:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:40:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:45:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-20 19:50:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 530, '2026-03-20 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 27-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-27 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-27 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-03-27 19:00:00 Australia/Melbourne'),
  ('Sauce', 'rebuy', 1000, '2026-03-27 19:05:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 230, '2026-03-27 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-03-27 19:02:00 Australia/Melbourne'),
  ('AT', 'cash_out', 9980, '2026-03-27 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-03-27 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 970, '2026-03-27 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-03-27 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 2250, '2026-03-27 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-27 19:08:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-03-27 19:13:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 770, '2026-03-27 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-27 19:10:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 2350, '2026-03-27 22:10:00 Australia/Melbourne'),
  ('Scott', 'buy_in', 1000, '2026-03-27 19:12:00 Australia/Melbourne'),
  ('Scott', 'rebuy', 1000, '2026-03-27 19:17:00 Australia/Melbourne'),
  ('Scott', 'rebuy', 1000, '2026-03-27 19:22:00 Australia/Melbourne'),
  ('Scott', 'cash_out', 0, '2026-03-27 22:12:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-03-27 19:14:00 Australia/Melbourne'),
  ('Fane', 'rebuy', 1000, '2026-03-27 19:19:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 950, '2026-03-27 22:14:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-03-27 19:16:00 Australia/Melbourne'),
  ('DK', 'cash_out', 3120, '2026-03-27 22:16:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-03-27 19:18:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-03-27 19:23:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 560, '2026-03-27 22:18:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-03-27 19:20:00 Australia/Melbourne'),
  ('Sam Abraham', 'rebuy', 1000, '2026-03-27 19:25:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 360, '2026-03-27 22:20:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-03-27 19:22:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 3060, '2026-03-27 22:22:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-03-27 19:24:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-27 19:29:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-27 19:34:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-27 19:39:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-03-27 19:44:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 10, '2026-03-27 22:24:00 Australia/Melbourne'),
  ('Ally', 'buy_in', 1000, '2026-03-27 19:26:00 Australia/Melbourne'),
  ('Ally', 'cash_out', 390, '2026-03-27 22:26:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 31-Mar-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-03-31 19:00:00 Australia/Melbourne'::timestamptz, '2026-03-31 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-03-31 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 5670, '2026-03-31 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-03-31 19:02:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-03-31 19:07:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-03-31 19:12:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-03-31 22:02:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-03-31 19:04:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 780, '2026-03-31 22:04:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-03-31 19:06:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 480, '2026-03-31 22:06:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-03-31 19:08:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 70, '2026-03-31 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 2-Apr-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-04-02 19:00:00 Australia/Melbourne'::timestamptz, '2026-04-02 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-04-02 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 780, '2026-04-02 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-04-02 19:02:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-04-02 19:07:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-04-02 19:12:00 Australia/Melbourne'),
  ('AT', 'cash_out', 990, '2026-04-02 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-04-02 19:04:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 7790, '2026-04-02 22:04:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-04-02 19:06:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 4090, '2026-04-02 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-04-02 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 3270, '2026-04-02 22:08:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-04-02 19:10:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-04-02 22:10:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-04-02 19:12:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 0, '2026-04-02 22:12:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-04-02 19:14:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-02 19:19:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-02 19:24:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-02 19:29:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-02 19:34:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-02 19:39:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 0, '2026-04-02 22:14:00 Australia/Melbourne'),
  ('Danny', 'buy_in', 1000, '2026-04-02 19:16:00 Australia/Melbourne'),
  ('Danny', 'rebuy', 1000, '2026-04-02 19:21:00 Australia/Melbourne'),
  ('Danny', 'rebuy', 1000, '2026-04-02 19:26:00 Australia/Melbourne'),
  ('Danny', 'cash_out', 430, '2026-04-02 22:16:00 Australia/Melbourne'),
  ('Alec N', 'buy_in', 1000, '2026-04-02 19:18:00 Australia/Melbourne'),
  ('Alec N', 'cash_out', 2650, '2026-04-02 22:18:00 Australia/Melbourne'),
  ('Sanjay', 'buy_in', 1000, '2026-04-02 19:20:00 Australia/Melbourne'),
  ('Sanjay', 'cash_out', 0, '2026-04-02 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 10-Apr-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-04-10 19:00:00 Australia/Melbourne'::timestamptz, '2026-04-10 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-04-10 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 1020, '2026-04-10 22:00:00 Australia/Melbourne'),
  ('Devin', 'buy_in', 1000, '2026-04-10 19:02:00 Australia/Melbourne'),
  ('Devin', 'cash_out', 360, '2026-04-10 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-04-10 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 2950, '2026-04-10 22:04:00 Australia/Melbourne'),
  ('Jason B', 'buy_in', 1000, '2026-04-10 19:06:00 Australia/Melbourne'),
  ('Jason B', 'cash_out', 570, '2026-04-10 22:06:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-04-10 19:08:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-04-10 22:08:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-04-10 19:10:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 1760, '2026-04-10 22:10:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-04-10 19:12:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 0, '2026-04-10 22:12:00 Australia/Melbourne'),
  ('Scott', 'buy_in', 1000, '2026-04-10 19:14:00 Australia/Melbourne'),
  ('Scott', 'cash_out', 1310, '2026-04-10 22:14:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-04-10 19:16:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 3280, '2026-04-10 22:16:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-04-10 19:18:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 0, '2026-04-10 22:18:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-04-10 19:20:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 5410, '2026-04-10 22:20:00 Australia/Melbourne'),
  ('Alec N', 'buy_in', 1000, '2026-04-10 19:22:00 Australia/Melbourne'),
  ('Alec N', 'cash_out', 230, '2026-04-10 22:22:00 Australia/Melbourne'),
  ('Sanjay', 'buy_in', 1000, '2026-04-10 19:24:00 Australia/Melbourne'),
  ('Sanjay', 'cash_out', 930, '2026-04-10 22:24:00 Australia/Melbourne'),
  ('Bianca', 'buy_in', 1000, '2026-04-10 19:26:00 Australia/Melbourne'),
  ('Bianca', 'rebuy', 1000, '2026-04-10 19:31:00 Australia/Melbourne'),
  ('Bianca', 'rebuy', 1000, '2026-04-10 19:36:00 Australia/Melbourne'),
  ('Bianca', 'cash_out', 0, '2026-04-10 22:26:00 Australia/Melbourne'),
  ('Branden', 'buy_in', 1000, '2026-04-10 19:28:00 Australia/Melbourne'),
  ('Branden', 'cash_out', 0, '2026-04-10 22:28:00 Australia/Melbourne'),
  ('Alex T', 'buy_in', 1000, '2026-04-10 19:30:00 Australia/Melbourne'),
  ('Alex T', 'cash_out', 0, '2026-04-10 22:30:00 Australia/Melbourne'),
  ('Danu', 'buy_in', 1000, '2026-04-10 19:32:00 Australia/Melbourne'),
  ('Danu', 'cash_out', 1180, '2026-04-10 22:32:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 16-Apr-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-04-16 19:00:00 Australia/Melbourne'::timestamptz, '2026-04-16 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-04-16 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 2780, '2026-04-16 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-04-16 19:02:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-04-16 19:07:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-04-16 19:12:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 840, '2026-04-16 22:02:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-04-16 19:04:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 6400, '2026-04-16 22:04:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-04-16 19:06:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-16 19:11:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-16 19:16:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-16 19:21:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-16 19:26:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-16 19:31:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 770, '2026-04-16 22:06:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-04-16 19:08:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 1210, '2026-04-16 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 17-Apr-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-04-17 19:00:00 Australia/Melbourne'::timestamptz, '2026-04-17 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-04-17 19:00:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-04-17 19:05:00 Australia/Melbourne'),
  ('AT', 'cash_out', 610, '2026-04-17 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-04-17 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 7210, '2026-04-17 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-04-17 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 950, '2026-04-17 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-04-17 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 940, '2026-04-17 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-04-17 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3950, '2026-04-17 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-04-17 19:10:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-04-17 19:15:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 420, '2026-04-17 22:10:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-04-17 19:12:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 0, '2026-04-17 22:12:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-04-17 19:14:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-04-17 19:19:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-04-17 19:24:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-04-17 19:29:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-04-17 19:34:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 100, '2026-04-17 22:14:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-04-17 19:16:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 1130, '2026-04-17 22:16:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-04-17 19:18:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-17 19:23:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 220, '2026-04-17 22:18:00 Australia/Melbourne'),
  ('Sanjay', 'buy_in', 1000, '2026-04-17 19:20:00 Australia/Melbourne'),
  ('Sanjay', 'cash_out', 2470, '2026-04-17 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 24-Apr-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-04-24 19:00:00 Australia/Melbourne'::timestamptz, '2026-04-24 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-04-24 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-04-24 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-04-24 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 2180, '2026-04-24 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-04-24 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 8210, '2026-04-24 22:04:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-04-24 19:06:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-04-24 19:11:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-04-24 19:16:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-04-24 19:21:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 790, '2026-04-24 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-04-24 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 30, '2026-04-24 22:08:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-04-24 19:10:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 0, '2026-04-24 22:10:00 Australia/Melbourne'),
  ('Sam G', 'buy_in', 1000, '2026-04-24 19:12:00 Australia/Melbourne'),
  ('Sam G', 'cash_out', 2750, '2026-04-24 22:12:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-04-24 19:14:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 1820, '2026-04-24 22:14:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-04-24 19:16:00 Australia/Melbourne'),
  ('Victor J', 'rebuy', 1000, '2026-04-24 19:21:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 720, '2026-04-24 22:16:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-04-24 19:18:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-24 19:23:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-24 19:28:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-24 19:33:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-04-24 19:38:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 110, '2026-04-24 22:18:00 Australia/Melbourne'),
  ('Sanjay', 'buy_in', 1000, '2026-04-24 19:20:00 Australia/Melbourne'),
  ('Sanjay', 'cash_out', 2390, '2026-04-24 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 1-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-01 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-01 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-05-01 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 910, '2026-05-01 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-01 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 4440, '2026-05-01 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-01 19:04:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-05-01 19:09:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-05-01 19:14:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-05-01 19:19:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 0, '2026-05-01 22:04:00 Australia/Melbourne'),
  ('Jason B', 'buy_in', 1000, '2026-05-01 19:06:00 Australia/Melbourne'),
  ('Jason B', 'cash_out', 4490, '2026-05-01 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-05-01 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 1200, '2026-05-01 22:08:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-05-01 19:10:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 3020, '2026-05-01 22:10:00 Australia/Melbourne'),
  ('Adi', 'buy_in', 1000, '2026-05-01 19:12:00 Australia/Melbourne'),
  ('Adi', 'cash_out', 430, '2026-05-01 22:12:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-05-01 19:14:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 840, '2026-05-01 22:14:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-05-01 19:16:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-01 19:21:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-01 19:26:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-01 19:31:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 670, '2026-05-01 22:16:00 Australia/Melbourne'),
  ('Om', 'buy_in', 1000, '2026-05-01 19:18:00 Australia/Melbourne'),
  ('Om', 'cash_out', 0, '2026-05-01 22:18:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 8-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-08 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-08 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-05-08 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 0, '2026-05-08 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-05-08 19:02:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-05-08 19:07:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-05-08 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-08 19:04:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 3220, '2026-05-08 22:04:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-08 19:06:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 5190, '2026-05-08 22:06:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-05-08 19:08:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 1770, '2026-05-08 22:08:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-05-08 19:10:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 1270, '2026-05-08 22:10:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-05-08 19:12:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 1190, '2026-05-08 22:12:00 Australia/Melbourne'),
  ('Ken', 'buy_in', 1000, '2026-05-08 19:14:00 Australia/Melbourne'),
  ('Ken', 'cash_out', 720, '2026-05-08 22:14:00 Australia/Melbourne'),
  ('Vincent', 'buy_in', 1000, '2026-05-08 19:16:00 Australia/Melbourne'),
  ('Vincent', 'cash_out', 2870, '2026-05-08 22:16:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-05-08 19:18:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-08 19:23:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 510, '2026-05-08 22:18:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-05-08 19:20:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 1960, '2026-05-08 22:20:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-05-08 19:22:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:27:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:32:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:37:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:42:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:47:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-08 19:52:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 0, '2026-05-08 22:22:00 Australia/Melbourne'),
  ('Om', 'buy_in', 1000, '2026-05-08 19:24:00 Australia/Melbourne'),
  ('Om', 'cash_out', 630, '2026-05-08 22:24:00 Australia/Melbourne'),
  ('Alvin', 'buy_in', 1000, '2026-05-08 19:26:00 Australia/Melbourne'),
  ('Alvin', 'cash_out', 2670, '2026-05-08 22:26:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 15-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-15 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-15 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-05-15 19:00:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-05-15 19:05:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-05-15 19:10:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-05-15 19:15:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-05-15 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-15 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 2490, '2026-05-15 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-15 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 11860, '2026-05-15 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-05-15 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 1620, '2026-05-15 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-05-15 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3570, '2026-05-15 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-05-15 19:10:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 0, '2026-05-15 22:10:00 Australia/Melbourne'),
  ('Vincent', 'buy_in', 1000, '2026-05-15 19:12:00 Australia/Melbourne'),
  ('Vincent', 'cash_out', 0, '2026-05-15 22:12:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-05-15 19:14:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:19:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:24:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:29:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:34:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:39:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:44:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-15 19:49:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 870, '2026-05-15 22:14:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-05-15 19:16:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 1960, '2026-05-15 22:16:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-05-15 19:18:00 Australia/Melbourne'),
  ('Victor J', 'rebuy', 1000, '2026-05-15 19:23:00 Australia/Melbourne'),
  ('Victor J', 'rebuy', 1000, '2026-05-15 19:28:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 0, '2026-05-15 22:18:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-05-15 19:20:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 630, '2026-05-15 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 20-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-20 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-20 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-05-20 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 1350, '2026-05-20 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-20 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-05-20 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-20 19:04:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-05-20 19:09:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 100, '2026-05-20 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-05-20 19:06:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 2710, '2026-05-20 22:06:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-05-20 19:08:00 Australia/Melbourne'),
  ('DK', 'cash_out', 1840, '2026-05-20 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 22-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-22 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-22 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-05-22 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 6830, '2026-05-22 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-22 19:02:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-05-22 19:07:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-05-22 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-22 19:04:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 4290, '2026-05-22 22:04:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-05-22 19:06:00 Australia/Melbourne'),
  ('Ray', 'rebuy', 1000, '2026-05-22 19:11:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-05-22 22:06:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-05-22 19:08:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 4000, '2026-05-22 22:08:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-05-22 19:10:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 2930, '2026-05-22 22:10:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-05-22 19:12:00 Australia/Melbourne'),
  ('DK', 'cash_out', 1000, '2026-05-22 22:12:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-05-22 19:14:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:19:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:24:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:29:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:34:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:39:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:44:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-05-22 19:49:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 890, '2026-05-22 22:14:00 Australia/Melbourne'),
  ('Sam Abraham', 'buy_in', 1000, '2026-05-22 19:16:00 Australia/Melbourne'),
  ('Sam Abraham', 'cash_out', 210, '2026-05-22 22:16:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-05-22 19:18:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 850, '2026-05-22 22:18:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-05-22 19:20:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-22 19:25:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 0, '2026-05-22 22:20:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 29-May-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-05-29 19:00:00 Australia/Melbourne'::timestamptz, '2026-05-29 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-05-29 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 940, '2026-05-29 22:00:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-05-29 19:02:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-05-29 19:07:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-05-29 22:02:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-05-29 19:04:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 530, '2026-05-29 22:04:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-05-29 19:06:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 4450, '2026-05-29 22:06:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-05-29 19:08:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 1760, '2026-05-29 22:08:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-05-29 19:10:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3820, '2026-05-29 22:10:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-05-29 19:12:00 Australia/Melbourne'),
  ('Doug', 'rebuy', 1000, '2026-05-29 19:17:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 250, '2026-05-29 22:12:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-05-29 19:14:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-05-29 19:19:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-05-29 19:24:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-05-29 19:29:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-05-29 19:34:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-05-29 22:14:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-05-29 19:16:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 7300, '2026-05-29 22:16:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-05-29 19:18:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 5950, '2026-05-29 22:18:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-05-29 19:20:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-29 19:25:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-29 19:30:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-29 19:35:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-05-29 19:40:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 0, '2026-05-29 22:20:00 Australia/Melbourne'),
  ('Alvin', 'buy_in', 1000, '2026-05-29 19:22:00 Australia/Melbourne'),
  ('Alvin', 'rebuy', 1000, '2026-05-29 19:27:00 Australia/Melbourne'),
  ('Alvin', 'rebuy', 1000, '2026-05-29 19:32:00 Australia/Melbourne'),
  ('Alvin', 'rebuy', 1000, '2026-05-29 19:37:00 Australia/Melbourne'),
  ('Alvin', 'cash_out', 0, '2026-05-29 22:22:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 5-Jun-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-06-05 19:00:00 Australia/Melbourne'::timestamptz, '2026-06-05 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Sauce', 'buy_in', 1000, '2026-06-05 19:00:00 Australia/Melbourne'),
  ('Sauce', 'cash_out', 160, '2026-06-05 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-06-05 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 3040, '2026-06-05 22:02:00 Australia/Melbourne'),
  ('Ray', 'buy_in', 1000, '2026-06-05 19:04:00 Australia/Melbourne'),
  ('Ray', 'cash_out', 0, '2026-06-05 22:04:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-06-05 19:06:00 Australia/Melbourne'),
  ('Riley', 'rebuy', 1000, '2026-06-05 19:11:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 870, '2026-06-05 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-06-05 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 1080, '2026-06-05 22:08:00 Australia/Melbourne'),
  ('Fane', 'buy_in', 1000, '2026-06-05 19:10:00 Australia/Melbourne'),
  ('Fane', 'cash_out', 1760, '2026-06-05 22:10:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-06-05 19:12:00 Australia/Melbourne'),
  ('DK', 'cash_out', 1070, '2026-06-05 22:12:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-06-05 19:14:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-05 19:19:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 380, '2026-06-05 22:14:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-06-05 19:16:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 1160, '2026-06-05 22:16:00 Australia/Melbourne'),
  ('Om', 'buy_in', 1000, '2026-06-05 19:18:00 Australia/Melbourne'),
  ('Om', 'cash_out', 2480, '2026-06-05 22:18:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 12-Jun-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-06-12 19:00:00 Australia/Melbourne'::timestamptz, '2026-06-12 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Derek', 'buy_in', 1000, '2026-06-12 19:00:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-06-12 22:00:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-06-12 19:02:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 6790, '2026-06-12 22:02:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-06-12 19:04:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-06-12 22:04:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-06-12 19:06:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:11:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:16:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:21:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:26:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:31:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:36:00 Australia/Melbourne'),
  ('Josh', 'rebuy', 1000, '2026-06-12 19:41:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 0, '2026-06-12 22:06:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-06-12 19:08:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 2970, '2026-06-12 22:08:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-06-12 19:10:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 3240, '2026-06-12 22:10:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

commit;
