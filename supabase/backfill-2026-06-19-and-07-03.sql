-- Q.Poker historical backfill: 19-Jun-26 and 3-Jul-26 (recorded late).
-- Same synthesis rule as prior backfills: $10 buy-ins, losers rounded up
-- to the nearest $10, cash_out - buy_in reproduces the recorded net exactly.
-- "Douglas" in the sheet is the existing player "Doug" (confirmed).
-- RUN ONCE.

begin;

-- Players: idempotent; only Zac (guest) is expected to be new.
insert into players (name, is_guest) select 'AT', false where not exists (select 1 from players where name = 'AT');
insert into players (name, is_guest) select 'Derek', false where not exists (select 1 from players where name = 'Derek');
insert into players (name, is_guest) select 'Francis', false where not exists (select 1 from players where name = 'Francis');
insert into players (name, is_guest) select 'Riley', false where not exists (select 1 from players where name = 'Riley');
insert into players (name, is_guest) select 'Doug', false where not exists (select 1 from players where name = 'Doug');
insert into players (name, is_guest) select 'DK', false where not exists (select 1 from players where name = 'DK');
insert into players (name, is_guest) select 'Josh', false where not exists (select 1 from players where name = 'Josh');
insert into players (name, is_guest) select 'Victor J', false where not exists (select 1 from players where name = 'Victor J');
insert into players (name, is_guest) select 'Wilson', false where not exists (select 1 from players where name = 'Wilson');
insert into players (name, is_guest) select 'Om', false where not exists (select 1 from players where name = 'Om');
insert into players (name, is_guest) select 'Zac', true where not exists (select 1 from players where name = 'Zac');

-- 19-Jun-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-06-19 19:00:00 Australia/Melbourne'::timestamptz, '2026-06-19 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('AT', 'buy_in', 1000, '2026-06-19 19:00:00 Australia/Melbourne'),
  ('AT', 'cash_out', 0, '2026-06-19 22:00:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-06-19 19:02:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-06-19 22:02:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-06-19 19:04:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-06-19 19:09:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-06-19 19:14:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-06-19 19:19:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-06-19 19:24:00 Australia/Melbourne'),
  ('Francis', 'rebuy', 1000, '2026-06-19 19:29:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 680, '2026-06-19 22:04:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-06-19 19:06:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 4000, '2026-06-19 22:06:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-06-19 19:08:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 1700, '2026-06-19 22:08:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-06-19 19:10:00 Australia/Melbourne'),
  ('DK', 'cash_out', 3860, '2026-06-19 22:10:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-06-19 19:12:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 0, '2026-06-19 22:12:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-06-19 19:14:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 2760, '2026-06-19 22:14:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- 3-Jul-26
with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-07-03 19:00:00 Australia/Melbourne'::timestamptz, '2026-07-03 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Francis', 'buy_in', 1000, '2026-07-03 19:00:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 1250, '2026-07-03 22:00:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-07-03 19:02:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 2180, '2026-07-03 22:02:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-07-03 19:04:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 1070, '2026-07-03 22:04:00 Australia/Melbourne'),
  ('Om', 'buy_in', 1000, '2026-07-03 19:06:00 Australia/Melbourne'),
  ('Om', 'cash_out', 0, '2026-07-03 22:06:00 Australia/Melbourne'),
  ('Zac', 'buy_in', 1000, '2026-07-03 19:08:00 Australia/Melbourne'),
  ('Zac', 'cash_out', 500, '2026-07-03 22:08:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

commit;
