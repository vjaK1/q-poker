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
