-- Sessions gain a 'discarded' status (decided 2026-07-25): a discarded session
-- is hidden from every list, stat and export, but its rows are never deleted.
-- The ledger stays append-only; nothing is destroyed.
alter table sessions drop constraint sessions_status_check;
alter table sessions add constraint sessions_status_check
  check (status in ('live', 'counting', 'saved', 'discarded'));
