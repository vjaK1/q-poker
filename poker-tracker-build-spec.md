# Poker session tracker — build spec

A mobile-first PWA for tracking home poker cash games. Single user (the banker). The core principle: an **append-only transaction ledger** is the only source of truth — every stat, leaderboard, and export is derived from it at read time. Nothing is ever edited or stored twice.

Primary use case: weekly cash game, $0.10/$0.20 blinds, $10 buy-ins, ~5–10 players. The app must stay generic to any cash game: only buy-ins, ending stacks, and timestamps matter. Blinds/stakes are not modelled in v1.

---

## 1. Stack

- **Frontend:** React + TypeScript + Vite, PWA (vite-plugin-pwa: manifest + service worker, `display: standalone`, installable to iPhone home screen).
- **Database:** Supabase (Postgres). **New dedicated project** — do not reuse any existing project.
- **Auth:** Supabase magic-link email auth, single user. Row-level security on all tables (authenticated user only).
- **Hosting:** Vercel, deploy on push to GitHub. Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel project settings.
- **Data layer rule:** all database access goes through a single module (`src/lib/ledger.ts`) exposing typed functions (`addBuyIn`, `addRebuy`, `addCashOut`, `addCorrection`, `getSessionEvents`, `getLeaderboard`, …). Components never import the Supabase client directly. This is so an offline/IndexedDB queue can be slotted in later as a one-file change.
- **Money:** integer cents everywhere in storage and logic (`4470` = $44.70). Format to dollars only at display time. Never use floats for money.
- **Time:** store `timestamptz` (UTC). Display in `Australia/Melbourne`.
- **Theming:** every colour is a CSS variable from day one. Theme applied via `data-theme` attribute on root. No hardcoded colours anywhere.

## 2. Data model

Three tables. No stored aggregates, no title fields, no computed columns.

```sql
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
  created_at              timestamptz not null default now()
);
```

**Append-only rule (hard requirement):** the app never issues `UPDATE` or `DELETE` on `transactions`. A mistake is fixed by inserting a `correction` row pointing at the bad row via `corrects_transaction_id` (with a `note`), optionally followed by a fresh correct entry. A transaction referenced by a correction is **voided** and excluded from all derived numbers, but remains fully visible in the audit view.

**Session naming:** sessions have no title. Display name is derived from `started_at`, formatted `Fri 24 Jul`. **Logical-day rule:** the session's date is the calendar date of `started_at − 3 hours` in Melbourne time, so a game that runs past midnight (or even starts at 1am) still belongs to the previous evening.

## 3. Derived values (definitions)

All computed at read time from non-voided transactions:

- **Player buy-in total (session):** sum of `buy_in` + `rebuy` amounts.
- **Player ending stack (session):** sum of `cash_out` amounts (usually one; mid-session cash-out + re-entry means multiple cash-outs and buy-ins — supported, no special casing).
- **Player net (session):** ending stack − buy-in total.
- **On-table total (live):** sum of buy-ins + rebuys − sum of cash-outs so far. Also equals what the cash box should hold minus paid-out cash-outs.
- **Session discrepancy:** at reconcile time, total cash-outs − total buy-ins. Zero = balanced.
- **Seat time (per player per session):** last cash-out timestamp − first buy-in timestamp *for that player*. Never use session length — players arrive and leave at different times.
- **$/hr:** lifetime net ÷ lifetime seat hours.
- **Win rate:** % of sessions played with net > 0.
- **Streak:** consecutive most-recent sessions with net > 0 (or < 0 for a losing streak).
- **Rate-stat threshold:** $/hr and win rate display as `—` until a player has ≥ 5 sessions.

## 4. App structure

Three bottom tabs: **Home**, **Sessions**, **Board**. Settings via gear icon in the Home header (not a tab).

### 4.1 Home (dashboard) — two states

**Idle state** (no live session):
- Header: "Home" + today's date, gear icon.
- Your bankroll card: lifetime net + small cumulative-P/L sparkline.
- Last session card: derived date name + your net.
- Leaderboard preview: top 3 by net, tap → Board tab.
- Primary button: **Start session**.

**Live state** (a session with `status = 'live'` or `'counting'` exists):
- A prominent live card replaces the top of the dashboard: "Live · started 19:02", elapsed timer, on-table total, **Resume session** button (one tap back into the live screen). Everything else compresses beneath it.
- Opening the app during a live session must reach the rebuy button in ≤ 2 taps.

### 4.2 Start session

- **Quick-start:** pre-seats the previous session's roster, each ready at the default buy-in. Adjust from there.
- Tap a player row to buy them in (records `buy_in` at default amount with timestamp). Rows show `$10 · 19:02` + check when done.
- "Add player" → pick from existing players or create new (name + guest flag).
- Session is created (`status = 'live'`) on the first buy-in, `started_at = now()`.

### 4.3 Live session

- On-table total, large and always visible. Sub-line: "Cash box should hold $X".
- Elapsed timer in header.
- Player rows: name, total in, timestamps of each buy-in/rebuy, and a **+$10** button (default buy-in amount from settings).
- Tapping +$10 opens a **confirmation sheet**: player name, amount, current time, "nth rebuy tonight" context line, and the instruction "Log first, then hand over the rack." Confirm → insert `rebuy`. Cancel dismisses.
- **Mid-session cash-out:** any player can cash out early (goes through the cash-out flow below) and later re-enter with a new buy-in. The ledger model handles this natively.
- Buttons: "Cash out" (single player), "End session" (starts the count queue, sets `status = 'counting'`).
- **Wake lock** (Screen Wake Lock API) active while this screen is open. **Haptic feedback** on rebuy confirm (Vibration API; degrade silently on iOS if unavailable). All touch targets ≥ 44px.

### 4.4 Cash-out (per player)

- Denomination steppers, one row per chip denomination (from settings; default $1.00 / $0.25 / $0.05). Each row: denomination, − count +, row subtotal.
- Auto-computed total, large. Below it: "Bought in $X" and net (green/red).
- **Second count step:** after the first count is entered, the screen prompts "Awaiting 2nd count" — a second person recounts and confirms (sets `second_count_confirmed = true`). Confirm inserts the `cash_out` with the denomination breakdown JSON.

### 4.5 Count queue (end of session)

- Header: "Count ending stacks · n of m".
- Player list: done rows (amount + "2nd count ✓"), the active counting row (highlighted, shows breakdown + awaiting-2nd-count state), pending rows.
- Footer, live: "Counted so far $X" and "Remaining should hold $Y" where Y = on-table total − counted. This is the mid-count tripwire — if the remaining physical stacks obviously can't hold $Y, the error is caught before the night ends.

### 4.6 Reconcile

Shown when all players are counted:
- Buy-ins logged vs cash-outs counted.
- **Balanced (delta = 0):** green banner "Balanced — every dollar accounted for", per-player nets, **Save session** (primary). Save sets `status = 'saved'`, `ended_at = now()`, then routes to the export screen.
- **Unbalanced:** warning banner showing the delta with a pattern-matched hint:
  - Delta is a positive multiple of the default buy-in → "Exactly n buy-in(s) over. Likely an unlogged rebuy — check whether the cash box holds $X." Offer a **Log missed rebuy** action (pick player → inserts a `rebuy`, re-runs reconcile).
  - Any other delta → "Likely a miscount or chips off the table — recount the largest stacks."
  - Saving while unbalanced is allowed but requires an explicit extra confirmation; the discrepancy is simply what the ledger shows and appears in exports.

### 4.7 Sessions tab

- Reverse-chronological list: derived date name, player count, your net, balanced ✓ / discrepancy amount.
- **Session detail:** per-player summary (buy-ins, ending stack, net), plus:
  - **Audit trail:** every transaction in chronological order — time, description ("Sam rebought"), signed amount, and the running on-table total after that event. Voided rows render struck-through and dimmed; their `correction` row renders warning-styled with the note. Footer: corrections count.
  - **Export** button → export screen for that session.

### 4.8 Board tab (leaderboard)

- Time-window chips: **All-time / Last 10 / Month**.
- Sort selector: net P/L (default), $/hr, games played, hours played, win rate.
- Ranked rows: rank, name, sub-line "23 games · 71h", right-aligned net (green/red).
- Footnote: "Rate stats need 5+ games." Guests (`is_guest`) excluded by default with a toggle to include.
- Tap a player → **profile**: avatar/initials, sessions count, cumulative bankroll line chart across sessions, stat cards (win rate, $/hr, best night, current streak, total hours, total rebuys).

### 4.9 Settings (gear from Home)

- **Theme:** System / Light / Dark (three-state, default System). Persist locally; apply via `data-theme`.
- **Default buy-in** (default $10.00).
- **Chip denominations** (default 100, 25, 5 cents) — drives the cash-out steppers.
- **Players:** add, rename, toggle guest, archive. (Rename is a `players` update; the append-only rule applies to `transactions` only.)

## 5. Exports

Reachable automatically after saving a session, and from any session detail.

### 5.1 Text export (group-chat format)

Monospace **live preview** exactly matching clipboard output, three toggles, then actions.

Line format, one player per line:

```
{name} ({-buyins}) {ending_stack} {net}
```

Rules:
- All monetary values `toFixed(2)` — always two decimals.
- **Padding:** name column padded to longest name + 1 space; bracket column padded to widest bracket; ending stack and net right-aligned to their widest value; two spaces between columns. Minus signs sit inside the right-aligned width so decimal points align.
- Buy-ins shown as a negative number in brackets (money in). Net = ending stack − buy-ins.
- **Header toggle (default on):** the derived date only, e.g. `Fri 24 Jul`, then a blank line. No buy-in amount, no player count.
- **Footer toggle (default on):** blank line, then `In {total}.00 · Out {total}.00 · Balanced` — or `Off by {delta}` if saved unbalanced.
- **Sort-by-net toggle (default off):** off = seat order (first buy-in time); on = descending net.

Reference output (must match byte-for-byte given this input):

```
Fri 24 Jul

Victor  (-20)  44.70   24.70
Francis (-60)  55.40   -4.60
DK      (-60)   0.00  -60.00
Ray     (-40)   0.00  -40.00
Doug    (-20)  57.50   37.50
AT      (-20)   0.00  -20.00
Josh    (-20)  31.80   11.80
Riley   (-10)  43.80   33.80
Ken     (-20)  10.80   -9.20
Wilson  (-30)  56.00   26.00

In 300.00 · Out 300.00 · Balanced
```

Actions: **Copy to clipboard** (primary, with confirmation toast), **Share** (Web Share API → iOS share sheet with the same text), **CSV** (below).

### 5.2 CSV export (two files)

`transactions.csv` — one row per event (the evidence file):
`session_id, session_date, timestamp, player, type, amount, denominations, running_table_total, corrects_event_id, note`

`sessions.csv` — one row per player per session (drops into the existing Excel sheet):
`session_id, date, player, buy_ins_total, rebuy_count, cash_out, net, seat_in, seat_out, hours_played, session_balanced, session_discrepancy`

Amounts in dollars with two decimals; timestamps ISO 8601 with Melbourne offset; `denominations` as the raw JSON string.

## 6. Visual style

Clean and flat: white/dark surfaces, hairline borders, generous spacing, no gradients or shadows. One accent colour for active/live states, green/red strictly for positive/negative money, amber for discrepancy warnings. Large type for money totals. Everything sized for one-handed phone use in bad lighting.

## 7. Build order

1. Supabase schema + RLS + magic-link auth; `ledger.ts` data layer with typed functions and derivation queries.
2. Session lifecycle: start (quick-start roster) → live screen with rebuy sheet → cash-out with denominations + second count → count queue → reconcile with hints → save.
3. Sessions tab: list, detail, audit trail.
4. Text export (implement against the reference output above), then CSV.
5. Home dashboard (both states), Board + player profiles.
6. Settings (theme, default buy-in, denominations, players), PWA polish (manifest, icons, wake lock, haptics).

Milestones 1–4 are the v1 that replaces the notes app on Friday. 5–6 are the fun layer and can follow.
