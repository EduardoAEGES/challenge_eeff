-- =========================================================
-- FINANCIAL CHALLENGE — esquema de Supabase
-- Pega TODO este archivo en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez sin romper nada.
--
-- Las cuentas del reto son propias (usuario y contraseña) y el
-- facilitador puede ver las contraseñas en su panel, como se pidió.
-- Por eso, pide a los participantes que NO usen una contraseña
-- que usen en otros sitios.
-- Nadie accede a las tablas directamente: todo pasa por funciones
-- que validan la contraseña del participante o la clave master.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.fc_config (
  k text primary key,
  v text not null
);
-- Clave master del panel del facilitador.
-- IMPORTANTE: antes de ejecutar, reemplaza CAMBIA-ESTA-CLAVE por tu clave real.
-- No guardes la clave real en el repositorio (es público).
-- Para cambiarla después: update public.fc_config set v = 'NUEVA-CLAVE' where k = 'master';
insert into public.fc_config (k, v) values ('master', 'CAMBIA-ESTA-CLAVE')
  on conflict (k) do nothing;

create table if not exists public.fc_participantes (
  id          uuid primary key default gen_random_uuid(),
  usuario     text not null unique,
  clave       text not null,
  nombre      text not null,
  condicion   text not null default 'Estudiante',
  progreso    jsonb not null default '{}'::jsonb,
  habilitado  int[] not null default '{}',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.fc_resultados (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.fc_participantes (id) on delete cascade,
  nivel           int not null,
  elecciones      int[] not null,
  segundos        int not null,
  vidas           int not null,
  comodin         boolean not null default false,
  puntaje         int not null,
  detalle         jsonb not null default '{}'::jsonb,
  creado          timestamptz not null default now(),
  unique (participante_id, nivel)
);

alter table public.fc_config enable row level security;
alter table public.fc_participantes enable row level security;
alter table public.fc_resultados enable row level security;
revoke all on public.fc_config, public.fc_participantes, public.fc_resultados from anon, authenticated;

-- ---------- Ayudantes ----------
create or replace function public.fc_es_master(p_master text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from fc_config where k = 'master' and v = p_master);
$$;

create or replace function public.fc_json_participante(p fc_participantes)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'usuario', p.usuario, 'nombre', p.nombre, 'condicion', p.condicion,
    'progreso', p.progreso, 'habilitado', to_jsonb(p.habilitado),
    'resultados', coalesce((select jsonb_object_agg(r.nivel::text, jsonb_build_object('puntaje', r.puntaje, 'segundos', r.segundos, 'vidas', r.vidas))
                            from fc_resultados r where r.participante_id = p.id), '{}'::jsonb)
  );
$$;

-- ---------- Participantes ----------
create or replace function public.fc_registrar(p_usuario text, p_clave text, p_nombre text, p_condicion text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u text := lower(trim(p_usuario));
  fila fc_participantes;
begin
  if length(u) < 3 or u !~ '^[a-z0-9._-]+$' then raise exception 'USUARIO_INVALIDO'; end if;
  if length(coalesce(p_clave, '')) < 4 then raise exception 'CLAVE_CORTA'; end if;
  if length(trim(coalesce(p_nombre, ''))) < 5 then raise exception 'NOMBRE_CORTO'; end if;
  if exists (select 1 from fc_participantes where usuario = u) then raise exception 'USUARIO_EXISTE'; end if;
  insert into fc_participantes (usuario, clave, nombre, condicion)
    values (u, p_clave, trim(p_nombre), coalesce(nullif(p_condicion, ''), 'Estudiante'))
    returning * into fila;
  return fc_json_participante(fila);
end $$;

create or replace function public.fc_entrar(p_usuario text, p_clave text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare fila fc_participantes;
begin
  select * into fila from fc_participantes where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
  return fc_json_participante(fila);
end $$;

create or replace function public.fc_guardar(p_usuario text, p_clave text, p_progreso jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update fc_participantes set progreso = p_progreso, actualizado = now()
    where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
end $$;

create or replace function public.fc_enviar_resultado(p_usuario text, p_clave text, p_nivel int, p_elecciones int[],
  p_segundos int, p_vidas int, p_comodin boolean, p_puntaje int, p_detalle jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare fila fc_participantes;
begin
  select * into fila from fc_participantes where usuario = lower(trim(p_usuario)) and clave = p_clave;
  if not found then raise exception 'CREDENCIALES'; end if;
  if not (p_nivel = any (fila.habilitado)) then raise exception 'NO_HABILITADO'; end if;
  insert into fc_resultados (participante_id, nivel, elecciones, segundos, vidas, comodin, puntaje, detalle)
    values (fila.id, p_nivel, p_elecciones, p_segundos, p_vidas, p_comodin, p_puntaje, coalesce(p_detalle, '{}'::jsonb))
    on conflict (participante_id, nivel) do nothing;  -- un solo intento por nivel
end $$;

-- Podio público (solo nombres y puntajes) para mostrarlo al terminar la final
create or replace function public.fc_podio(p_nivel int)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select p.nombre, r.puntaje, r.segundos
    from fc_resultados r join fc_participantes p on p.id = r.participante_id
    where r.nivel = p_nivel
    order by r.puntaje desc, r.segundos asc
    limit 3
  ) x;
$$;

-- ---------- Facilitador (requieren la clave master) ----------
create or replace function public.fc_admin_listar(p_master text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  return coalesce((select jsonb_agg(fc_json_participante(p) || jsonb_build_object('clave', p.clave, 'creado', p.creado) order by p.creado)
                   from fc_participantes p), '[]'::jsonb);
end $$;

create or replace function public.fc_admin_habilitar(p_master text, p_ids uuid[], p_nivel int, p_valor boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  if p_valor then
    update fc_participantes set habilitado = array_append(array_remove(habilitado, p_nivel), p_nivel) where id = any (p_ids);
  else
    update fc_participantes set habilitado = array_remove(habilitado, p_nivel) where id = any (p_ids);
  end if;
end $$;

create or replace function public.fc_admin_ranking(p_master text, p_nivel int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  return coalesce((select jsonb_agg(x) from (
    select r.id, p.id as participante_id, p.nombre, p.usuario, p.condicion, r.puntaje, r.segundos, r.vidas, r.comodin, r.elecciones, r.creado
    from fc_resultados r join fc_participantes p on p.id = r.participante_id
    where r.nivel = p_nivel
    order by r.puntaje desc, r.segundos asc
  ) x), '[]'::jsonb);
end $$;

create or replace function public.fc_admin_borrar_resultado(p_master text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  delete from fc_resultados where id = p_id;
end $$;

create or replace function public.fc_admin_borrar_participante(p_master text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not fc_es_master(p_master) then raise exception 'MASTER'; end if;
  delete from fc_participantes where id = p_id;
end $$;

grant execute on function public.fc_registrar(text, text, text, text), public.fc_entrar(text, text), public.fc_guardar(text, text, jsonb),
  public.fc_enviar_resultado(text, text, int, int[], int, int, boolean, int, jsonb), public.fc_podio(int),
  public.fc_admin_listar(text), public.fc_admin_habilitar(text, uuid[], int, boolean), public.fc_admin_ranking(text, int),
  public.fc_admin_borrar_resultado(text, uuid), public.fc_admin_borrar_participante(text, uuid)
  to anon, authenticated;
revoke execute on function public.fc_es_master(text), public.fc_json_participante(fc_participantes) from anon, authenticated, public;
