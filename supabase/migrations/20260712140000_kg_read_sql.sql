-- Feature 006 — general READ-ONLY SQL surface for the BBQS agent (kgSql tool).
--
-- Runs the given query AS THE CALLER (SECURITY INVOKER → RLS is the authority): a signed-in
-- member reads exactly what the KG's own PostgREST API already shows them, but with the
-- expressiveness of real SQL (JOIN / GROUP BY / aggregates). It adds no access, only power.
--
-- SELECT-only is STRUCTURAL, not a keyword blocklist: the query is wrapped as a subquery
--   select * from ( <query> ) _q limit N
-- so writes, DDL, data-modifying CTEs, and stacked statements are all invalid in that
-- position and raise a syntax error — they never execute. Bounded by a statement timeout
-- and a row cap. Returns a JSON array of row objects.
--
-- KG migrations are NOT applied by `db push` — run this in the KG SQL editor
-- (project vpexxhfpvghlejljwpvt). The agent degrades gracefully until it exists (kgSql
-- returns a "function not found" error and the LLM falls back to the structured tools).
--
-- SECURITY ASSUMPTION: any table reachable here is already reachable by this user via the
-- KG's PostgREST under the same role + RLS. Sensitive data must be protected by RLS, not by
-- absence from an allowlist. Ensure every public table has RLS enabled.

create or replace function public.kg_read_sql(query text, max_rows int default 200)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  result  jsonb;
  cleaned text := btrim(query);
  cap     int  := least(greatest(coalesce(max_rows, 200), 1), 1000);
begin
  -- Only read queries. (The subquery wrap below is the real guarantee; this is a fast,
  -- clear rejection for the common case.)
  if cleaned !~* '^(select|with)\s' then
    raise exception 'kg_read_sql: only read-only SELECT/WITH queries are allowed';
  end if;

  -- Strip a single trailing semicolon so the subquery wrap stays valid. Any remaining
  -- statement separator makes the wrapped SQL a syntax error (fails safe, never injects).
  cleaned := regexp_replace(cleaned, ';\s*$', '');

  -- Bound cost of a runaway/expensive query.
  set local statement_timeout = '5s';

  execute format(
    'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from (%s) _q limit %s) t',
    cleaned, cap
  ) into result;

  return result;
end;
$$;

revoke all on function public.kg_read_sql(text, int) from public, anon;
grant execute on function public.kg_read_sql(text, int) to authenticated;
