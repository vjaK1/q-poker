-- Q.Poker — initial schema (milestone 1)
-- Three tables per the spec. No stored aggregates, no title fields, no computed columns.
-- transactions is APPEND-ONLY: enforced here with RLS (select+insert policies only)
-- plus an explicit revoke, so UPDATE/DELETE fail at the database regardless of app code.

create table players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_guest    boolean not null default false,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create table sessions (
  id         uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  status     text not null default 'live'
             check (status in ('live', 'counting', 'saved')),
  created_at timestamptz not null default now()
);

create table transactions (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references sessions(id),
  player_id               uuid not null references players(id),
  type                    text not null
                          check (type in ('buy_in', 'rebuy', 'cash_out', 'correction')),
  amount_cents            integer not null check (amount_cents >= 0),
  denominations           jsonb,        -- cash_out only: {"100": 4, "25": 12, "5": 10} (keys = cents)
  second_count_confirmed  boolean not null default false,  -- cash_out only
  corrects_transaction_id uuid references transactions(id), -- correction only
  note                    text,         -- correction reason
  created_at              timestamptz not null default now(),

  -- Integrity checks encoding the column rules above:
  constraint correction_has_target
    check ((type = 'correction') = (corrects_transaction_id is not null)),
  constraint correction_amount_zero
    check (type <> 'correction' or amount_cents = 0),
  constraint denominations_cash_out_only
    check (denominations is null or type = 'cash_out'),
  constraint second_count_cash_out_only
    check (second_count_confirmed = false or type = 'cash_out')
);

create index transactions_session_id_idx on transactions (session_id);
create index transactions_player_id_idx  on transactions (player_id);
create index transactions_corrects_idx   on transactions (corrects_transaction_id);

-- Row-level security: single authenticated user (the banker).
alter table players      enable row level security;
alter table sessions     enable row level security;
alter table transactions enable row level security;

create policy players_select on players for select to authenticated using (true);
create policy players_insert on players for insert to authenticated with check (true);
create policy players_update on players for update to authenticated using (true) with check (true);

create policy sessions_select on sessions for select to authenticated using (true);
create policy sessions_insert on sessions for insert to authenticated with check (true);
create policy sessions_update on sessions for update to authenticated using (true) with check (true);

create policy transactions_select on transactions for select to authenticated using (true);
create policy transactions_insert on transactions for insert to authenticated with check (true);
-- Deliberately NO update/delete policies on transactions (append-only ledger),
-- and NO delete policies anywhere (v1 has no delete feature; players archive instead).

-- Table privileges: newer Supabase projects do not auto-grant privileges on
-- new tables, and the append-only rule wants an explicit matrix anyway.
-- Grant exactly what the app may do, nothing more; anon gets nothing.
grant usage on schema public to authenticated;

grant select, insert, update on table players      to authenticated;
grant select, insert, update on table sessions     to authenticated;
grant select, insert         on table transactions to authenticated;

-- Belt and braces for environments that DO auto-grant broad privileges:
-- make UPDATE/DELETE on the ledger error loudly rather than no-op.
revoke all on table players, sessions, transactions from anon;
revoke update, delete on table transactions from authenticated;
revoke delete on table players, sessions from authenticated;
