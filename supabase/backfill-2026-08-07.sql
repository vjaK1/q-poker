-- Q.Poker historical backfill: 07-Aug-26
-- Same synthesis rule as the H1 backfill: $10 buy-ins, losers rounded up to
-- the nearest $10 to cover the loss, cash_out - buy_in = recorded net exactly.

begin;

-- Players: idempotent, only inserts names that do not already exist.
insert into players (name, is_guest) select 'Derek', false where not exists (select 1 from players where name = 'Derek');
insert into players (name, is_guest) select 'Francis', false where not exists (select 1 from players where name = 'Francis');
insert into players (name, is_guest) select 'Riley', false where not exists (select 1 from players where name = 'Riley');
insert into players (name, is_guest) select 'DK', false where not exists (select 1 from players where name = 'DK');
insert into players (name, is_guest) select 'Josh', false where not exists (select 1 from players where name = 'Josh');
insert into players (name, is_guest) select 'Victor J', false where not exists (select 1 from players where name = 'Victor J');
insert into players (name, is_guest) select 'Wilson', false where not exists (select 1 from players where name = 'Wilson');
insert into players (name, is_guest) select 'Alvin', false where not exists (select 1 from players where name = 'Alvin');

with s as (
  insert into sessions (started_at, ended_at, status)
  values ('2026-08-07 19:00:00 Australia/Melbourne'::timestamptz, '2026-08-07 22:00:00 Australia/Melbourne'::timestamptz, 'saved')
  returning id
)
insert into transactions (session_id, player_id, type, amount_cents, created_at)
select s.id, p.id, t.type, t.amount_cents, t.created_at::timestamptz
from s, (values
  ('Derek', 'buy_in', 1000, '2026-08-07 19:00:00 Australia/Melbourne'),
  ('Derek', 'rebuy', 1000, '2026-08-07 19:05:00 Australia/Melbourne'),
  ('Derek', 'cash_out', 0, '2026-08-07 22:00:00 Australia/Melbourne'),
  ('Francis', 'buy_in', 1000, '2026-08-07 19:02:00 Australia/Melbourne'),
  ('Francis', 'cash_out', 1950, '2026-08-07 22:02:00 Australia/Melbourne'),
  ('Riley', 'buy_in', 1000, '2026-08-07 19:04:00 Australia/Melbourne'),
  ('Riley', 'cash_out', 0, '2026-08-07 22:04:00 Australia/Melbourne'),
  ('DK', 'buy_in', 1000, '2026-08-07 19:06:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-08-07 19:11:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-08-07 19:16:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-08-07 19:21:00 Australia/Melbourne'),
  ('DK', 'rebuy', 1000, '2026-08-07 19:26:00 Australia/Melbourne'),
  ('DK', 'cash_out', 0, '2026-08-07 22:06:00 Australia/Melbourne'),
  ('Josh', 'buy_in', 1000, '2026-08-07 19:08:00 Australia/Melbourne'),
  ('Josh', 'cash_out', 530, '2026-08-07 22:08:00 Australia/Melbourne'),
  ('Victor J', 'buy_in', 1000, '2026-08-07 19:10:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 11520, '2026-08-07 22:10:00 Australia/Melbourne'),
  ('Wilson', 'buy_in', 1000, '2026-08-07 19:12:00 Australia/Melbourne'),
  ('Wilson', 'cash_out', 0, '2026-08-07 22:12:00 Australia/Melbourne'),
  ('Alvin', 'buy_in', 1000, '2026-08-07 19:14:00 Australia/Melbourne'),
  ('Alvin', 'rebuy', 1000, '2026-08-07 19:19:00 Australia/Melbourne'),
  ('Alvin', 'cash_out', 0, '2026-08-07 22:14:00 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

commit;
