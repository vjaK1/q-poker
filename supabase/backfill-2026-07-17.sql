-- Q.Poker historical backfill: 17-Jul-26
-- Same synthesis rule as the H1 backfill: $10 buy-ins, losers rounded up to
-- the nearest $10 to cover the loss, cash_out - buy_in = recorded net exactly.

begin;

-- Players: idempotent, only inserts names that do not already exist.
insert into players (name, is_guest) select 'Wilson', false where not exists (select 1 from players where name = 'Wilson');
insert into players (name, is_guest) select 'Sanjay', false where not exists (select 1 from players where name = 'Sanjay');
insert into players (name, is_guest) select 'Victor J', false where not exists (select 1 from players where name = 'Victor J');
insert into players (name, is_guest) select 'Josh', false where not exists (select 1 from players where name = 'Josh');
insert into players (name, is_guest) select 'Henry Xiong', false where not exists (select 1 from players where name = 'Henry Xiong');
insert into players (name, is_guest) select 'Francis', false where not exists (select 1 from players where name = 'Francis');
insert into players (name, is_guest) select 'Riley', false where not exists (select 1 from players where name = 'Riley');
insert into players (name, is_guest) select 'Doug', false where not exists (select 1 from players where name = 'Doug');
insert into players (name, is_guest) select 'AT', false where not exists (select 1 from players where name = 'AT');
insert into players (name, is_guest) select 'Mitch', false where not exists (select 1 from players where name = 'Mitch');
insert into players (name, is_guest) select 'Bella', true where not exists (select 1 from players where name = 'Bella');
insert into players (name, is_guest) select 'Srikar', false where not exists (select 1 from players where name = 'Srikar');
insert into players (name, is_guest) select 'Derek', false where not exists (select 1 from players where name = 'Derek');
insert into players (name, is_guest) select 'DK', false where not exists (select 1 from players where name = 'DK');

with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-07-17 19:00:00 Australia/Melbourne'::timestamptz, '2026-07-17 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Wilson', 'buy_in', 1000, '2026-07-17 19:00:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:05:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:10:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:15:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:20:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:25:00 Australia/Melbourne'),
  ('Wilson', 'rebuy', 1000, '2026-07-17 19:30:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 600, '2026-07-17 22:00:00 Australia/Melbourne'),
  ('Sanjay', 'buy_in', 1000, '2026-07-17 19:02:00 Australia/Melbourne'),
  ('Sanjay', 'cash_out', 2670, '2026-07-17 22:02:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-07-17 19:04:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 2940, '2026-07-17 22:04:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-07-17 19:06:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 4330, '2026-07-17 22:06:00 Australia/Melbourne'),
  ('Henry Xiong', 'buy_in', 1000, '2026-07-17 19:08:00 Australia/Melbourne'),
  ('Henry Xiong', 'cash_out', 3100, '2026-07-17 22:08:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-07-17 19:10:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 1650, '2026-07-17 22:10:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-07-17 19:12:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 3130, '2026-07-17 22:12:00 Australia/Melbourne'),
  ('Doug', 'buy_in', 1000, '2026-07-17 19:14:00 Australia/Melbourne'),
  ('Doug', 'cash_out', 90, '2026-07-17 22:14:00 Australia/Melbourne'),
  ('AT', 'buy_in', 1000, '2026-07-17 19:16:00 Australia/Melbourne'),
  ('AT', 'rebuy', 1000, '2026-07-17 19:21:00 Australia/Melbourne'),
  ('AT', 'cash_out', 990, '2026-07-17 22:16:00 Australia/Melbourne'),
  ('Mitch', 'buy_in', 1000, '2026-07-17 19:18:00 Australia/Melbourne'),
  ('Mitch', 'cash_out', 5500, '2026-07-17 22:18:00 Australia/Melbourne'),
  ('Bella', 'buy_in', 1000, '2026-07-17 19:20:00 Australia/Melbourne'),
  ('Bella', 'cash_out', 0, '2026-07-17 22:20:00 Australia/Melbourne'),
  ('Srikar', 'buy_in', 1000, '2026-07-17 19:22:00 Australia/Melbourne'),
  ('Srikar', 'rebuy', 1000, '2026-07-17 19:27:00 Australia/Melbourne'),
  ('Srikar', 'rebuy', 1000, '2026-07-17 19:32:00 Australia/Melbourne'),
  ('Srikar', 'cash_out', 0, '2026-07-17 22:22:00 Australia/Melbourne'),
  ('Derek', 'buy_in', 1000, '2026-07-17 19:24:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-07-17 19:29:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-07-17 19:34:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-07-17 22:24:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-07-17 19:26:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-07-17 22:26:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

commit;
