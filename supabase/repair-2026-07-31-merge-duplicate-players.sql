-- Repair 2026-07-31: merge duplicate player profiles (Ken, Wilson, Derek)
-- created mid-session by the Add player flow. For each name the OLDEST
-- profile is the original; transactions on newer duplicates are repointed
-- to it, then the duplicate profiles are deleted.
--
-- Deliberate one-off exception to the append-only rule, run as admin in the
-- SQL editor: it rewrites player_id REFERENCES only. No amounts, types or
-- timestamps change, and no ledger rows are added or removed.

begin;

create temp table _merge_pairs on commit drop as
with ranked as (
  select id,
         lower(trim(name)) as key,
         row_number() over (partition by lower(trim(name)) order by created_at) as rn
  from players
  where lower(trim(name)) in ('ken', 'wilson', 'derek')
)
select o.id as original_id, d.id as dup_id
from ranked o
join ranked d on d.key = o.key and d.rn > 1
where o.rn = 1;

update transactions t
set player_id = mp.original_id
from _merge_pairs mp
where t.player_id = mp.dup_id;

delete from players where id in (select dup_id from _merge_pairs);

commit;

-- Verification: exactly one row per name, with their full transaction counts
-- (history + tonight combined).
select p.name, p.created_at::date as profile_created, count(t.id) as transactions
from players p
left join transactions t on t.player_id = p.id
where lower(trim(p.name)) in ('ken', 'wilson', 'derek')
group by p.id, p.name, p.created_at
order by p.name;
