-- =========================================================
-- FINANCIAL CHALLENGE — actualización: congelar acceso
-- Pega TODO este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez. No borra ni cambia datos:
-- solo agrega la columna «bloqueado» y actualiza las funciones.
-- (Ya está incluido en financial-challenge.sql para instalaciones nuevas.)
-- =========================================================

-- Participante congelado: no puede entrar, guardar avance ni enviar resultados
alter table public.fc_participantes add column if not exists bloqueado boolean not null default false;

create or replace function public.fc_json_participante(p fc_participantes)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'usuario', p.usuario, 'nombre', p.nombre, 'condicion', p.condicion,
    'progreso', p.progreso, 'habilitado', to_jsonb(p.habilitado), 'bloqueado', p.bloqueado,
    'resultados', coalesce((select jsonb_object_agg(r.nivel::text, jsonb_build_object('puntaje', r.puntaje, 'segundos', r.segundos, 'vidas', r.vidas))
                            from fc_resultados r where r.participante_id = p.id), '{}'::jsonb)
  );
$$;

create or replace function public.fc_entrar(p_usuario text, p_clave text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare fila fc_participantes;
begin
  select * into fila from fc_participantes where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
  if fila.bloqueado then raise exception 'BLOQUEADO'; end if;
  update fc_participantes set visto = now() where id = fila.id returning * into fila;
  return fc_json_participante(fila);
end $$;

create or replace function public.fc_guardar(p_usuario text, p_clave text, p_progreso jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare fila fc_participantes;
begin
  select * into fila from fc_participantes where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
  if fila.bloqueado then raise exception 'BLOQUEADO'; end if;
  -- La respuesta a la invitación solo se cambia con fc_invitacion (controla el cupo)
  update fc_participantes set
      progreso = case when progreso ? 'invitacion' then jsonb_set(coalesce(p_progreso, '{}'::jsonb), '{invitacion}', progreso->'invitacion')
                      else coalesce(p_progreso, '{}'::jsonb) - 'invitacion' end,
      actualizado = now(), visto = now()
    where id = fila.id;
end $$;

create or replace function public.fc_enviar_resultado(p_usuario text, p_clave text, p_nivel int, p_elecciones int[],
  p_segundos int, p_vidas int, p_comodin boolean, p_puntaje int, p_detalle jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare fila fc_participantes;
begin
  select * into fila from fc_participantes where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
  if fila.bloqueado then raise exception 'BLOQUEADO'; end if;
  if not (p_nivel = any (fila.habilitado)) then raise exception 'NO_HABILITADO'; end if;
  insert into fc_resultados (participante_id, nivel, elecciones, segundos, vidas, comodin, puntaje, detalle)
    values (fila.id, p_nivel, p_elecciones, p_segundos, p_vidas, p_comodin, p_puntaje, coalesce(p_detalle, '{}'::jsonb))
    on conflict (participante_id, nivel) do nothing;  -- un solo intento por nivel
end $$;

-- El facilitador congela o descongela el acceso de varios participantes
create or replace function public.fc_admin_bloquear(p_master text, p_ids uuid[], p_valor boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  update fc_participantes set bloqueado = p_valor where id = any (p_ids);
end $$;

grant execute on function public.fc_entrar(text, text), public.fc_guardar(text, text, jsonb),
  public.fc_enviar_resultado(text, text, int, int[], int, int, boolean, int, jsonb),
  public.fc_admin_bloquear(text, uuid[], boolean) to anon, authenticated;
revoke execute on function public.fc_json_participante(fc_participantes) from anon, authenticated, public;

notify pgrst, 'reload schema';
