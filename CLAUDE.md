# Q.Poker — working rules

Read `poker-tracker-build-spec.md` before making any design decision. It is the source of truth.

## Hard constraints

1. **Money is integer cents** in storage and logic (`4470` = $44.70). Format to dollars only at display time. Never floats.
2. **`transactions` is append-only.** Never issue UPDATE or DELETE on it (RLS also blocks them at the DB). Mistakes are fixed by inserting `correction` rows.
3. **All database access goes through `src/lib/ledger.ts`.** Components never import the Supabase client; `src/lib/supabaseClient.ts` is imported only by `ledger.ts` and `auth.ts`.
4. **Every colour is a CSS variable**; themes switch via `data-theme` on `<html>`. No hardcoded colours in styles or components.
5. **Timestamps stored UTC**, displayed in `Australia/Melbourne`. Session dates use the 3am logical-day rule (calendar date of `started_at − 3h`, Melbourne time).

## Agreed decisions (2026-07-25)

- Correction rows always carry `amount_cents = 0`; their only effect is voiding their target. A correction of a correction un-voids the original.
- Settings (theme, default buy-in, denominations, "this is me" player) live in localStorage — no settings table.
- Board "Last 10" = the 10 most recent saved group sessions; "Month" = current calendar month, Melbourne, 3am rule applied.
- A $0 net is neither a win nor a loss; leaderboard/lifetime stats count only `status = 'saved'` sessions.
- Sessions are never deleted: unwanted ones get `status = 'discarded'` (hidden from all lists, stats and exports; rows remain). Undo in the UI = a `correction` row with note "Undo".
- UI copy: no em dashes, no timestamps on player rows (audit trail only), amounts styled prominently (`.row-amount`).
- Player names are unique, case/whitespace-insensitively (app check + DB index, 2026-07-31). Same-named humans get an initial.
- Dependencies are frozen at: react, react-dom, @supabase/supabase-js (+ dev: vite, @vitejs/plugin-react, vite-plugin-pwa, typescript, @types/react*, vitest). Ask Victor before adding anything else.
- Themes (2026-08-01): `light` = **Paper** (cream ledger book, New York/system serif display via `--font-display`, accounting red/green), `dark` = **Midnight** (near-black, gold accent, thin numerals, frosted tab bar). Paper is the default; `system` = "Match phone". Fonts are system stacks only, no font files. Card-room green direction was rejected.
- Home (2026-09-06): bankroll card (+ a "this month" line) and a six-tile personal stat grid: Win rate, Average night (mean net, whole cents), Best night and Worst night with dates (earliest night keeps a tie), Streak, Rank (all-time net Board, guests hidden). The Last session card and top-3 Leaderboard preview were removed as duplicates of their tabs. Buy-in based stats (average buy-in, return, bust rate, rebuys) are deliberately held back: backfilled history has synthesized buy-in/cash-out detail, only nets are exact. `computePlayerStats` in derive.ts is the one place these are defined.
- Settle up (2026-09-06, spec §5.3): the Export screen lists who pays whom via `computeSettlement` (exact matches first, then biggest loser pays biggest winner; never more than players−1 transfers; deterministic). Copy-to-clipboard only, no share button. Balanced nights only ("Fix the count first" otherwise). Wording is `X pays Y $Z`, two decimals. No paid-tracking and no settlement table, by decision.
- Who are you? (2026-09-06, spec §4.10): a full-screen picker sets `myPlayerId` after first sign-in (never while a game is live). `whoAmIDismissed` in localStorage makes Not now stay quiet; Home's "Pick your name" and Settings' "You → Change" open the same screen. The "This is me" checkbox was removed from the player edit sheet. No player creation on that screen.
