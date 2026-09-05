-- Callable by any authenticated user; runs as owner so it can insert into
-- audit_logs without needing a broad INSERT policy on that table.
create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_previous_state jsonb default null,
  p_new_state jsonb default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_state, new_state, reason)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_previous_state, p_new_state, p_reason);
end;
$$;

grant execute on function public.log_audit_event(text, text, uuid, jsonb, jsonb, text) to authenticated;
