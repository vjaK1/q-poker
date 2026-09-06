-- Q.Poker backfill: the second game of Fri 4 Sep 2026, folded into the
-- night's saved session (a60707b6-e3be-4db9-afde-5a50590818bc).
--
-- The first game (six players, in 240.00 / out 240.00) was recorded in the
-- app. Afterwards Wilson, Victor J, Francis and Sanjay played a second game
-- whose results were only kept as nets:
--
--   Wilson   +37.40
--   Victor J +26.40
--   Francis  -23.80
--   Sanjay   -40.00     (sums to zero)
--
-- Same synthesis rule as every backfill: $10 buy-ins, losers rounded up to
-- the nearest $10 to cover the loss, cash_out - buy_ins = recorded net
-- exactly. The rows are appended after the first game's cash-outs as
-- re-entries, so nothing already recorded is touched and the session stays
-- balanced (330.00 / 330.00). Combined nights afterwards:
--
--   Victor J +43.90   Wilson +26.30   Josh +18.50
--   Francis   +1.30   Alvin -31.90    Sanjay -58.10
--
-- Safe to run once. Running it again (or against the wrong session) stops
-- at the guards below with "division by zero" and writes nothing.

begin;

-- Guard 1: the session is saved and has no rows after the first game yet.
select 1 / (case when
  (select status from sessions where id = 'a60707b6-e3be-4db9-afde-5a50590818bc') = 'saved'
  and (select count(*) from transactions
       where session_id = 'a60707b6-e3be-4db9-afde-5a50590818bc'
         and created_at > '2026-09-04 14:26:30+00') = 0
  then 1 else 0 end) as guard_session;

-- Guard 2: all four players exist under exactly these names.
select 1 / (case when
  (select count(*) from players where name in ('Wilson', 'Victor J', 'Francis', 'Sanjay')) = 4
  then 1 else 0 end) as guard_players;

insert into transactions (session_id, player_id, type, amount_cents, created_at)
select 'a60707b6-e3be-4db9-afde-5a50590818bc', p.id, t.type, t.amount_cents, t.created_at::timestamptz
from (values
  -- re-entries (the first game's cash-outs were at 00:25-00:26 local)
  ('Wilson',   'buy_in',   1000, '2026-09-05 00:27:00 Australia/Melbourne'),
  ('Victor J', 'buy_in',   1000, '2026-09-05 00:27:10 Australia/Melbourne'),
  ('Francis',  'buy_in',   1000, '2026-09-05 00:27:20 Australia/Melbourne'),
  ('Sanjay',   'buy_in',   1000, '2026-09-05 00:27:30 Australia/Melbourne'),
  -- losers' extra buy-ins to cover the loss
  ('Francis',  'rebuy',    1000, '2026-09-05 00:28:00 Australia/Melbourne'),
  ('Francis',  'rebuy',    1000, '2026-09-05 00:28:10 Australia/Melbourne'),
  ('Sanjay',   'rebuy',    1000, '2026-09-05 00:28:20 Australia/Melbourne'),
  ('Sanjay',   'rebuy',    1000, '2026-09-05 00:28:30 Australia/Melbourne'),
  ('Sanjay',   'rebuy',    1000, '2026-09-05 00:28:40 Australia/Melbourne'),
  -- cash-outs: net = cash_out - buy-ins
  ('Wilson',   'cash_out', 4740, '2026-09-05 00:35:00 Australia/Melbourne'),
  ('Victor J', 'cash_out', 3640, '2026-09-05 00:35:10 Australia/Melbourne'),
  ('Francis',  'cash_out',  620, '2026-09-05 00:35:20 Australia/Melbourne'),
  ('Sanjay',   'cash_out',    0, '2026-09-05 00:35:30 Australia/Melbourne')
) as t(player_name, type, amount_cents, created_at)
join players p on p.name = t.player_name;

-- Verify: one row per player for the whole night. Expect the combined nets
-- listed above and totals of 33000 in / 33000 out.
select p.name,
       sum(case when t.type in ('buy_in', 'rebuy') then t.amount_cents else 0 end) as in_cents,
       sum(case when t.type = 'cash_out' then t.amount_cents else 0 end) as out_cents,
       sum(case when t.type = 'cash_out' then t.amount_cents else -t.amount_cents end) as net_cents
from transactions t
join players p on p.id = t.player_id
where t.session_id = 'a60707b6-e3be-4db9-afde-5a50590818bc'
  and t.type <> 'correction'
group by p.name
order by net_cents desc;

commit;
