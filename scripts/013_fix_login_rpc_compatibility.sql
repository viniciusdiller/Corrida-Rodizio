-- Supabase-side fix: keep auth RPC signatures compatible with app (`p_username`)
-- while supporting deployments where `public.logins` uses either:
--   - username (current schema)
--   - code (legacy schema)

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.logins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  preferred_language text
);

create or replace function public._logins_identity_column()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'logins'
       and column_name = 'username'
  ) then
    return 'username';
  end if;

  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'logins'
       and column_name = 'code'
  ) then
    return 'code';
  end if;

  raise exception 'public.logins must have either username or code column';
end;
$$;

create or replace function public.create_login(p_username text, p_password text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  identity_col text;
  normalized_username text;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  execute format(
    'insert into public.logins (%I, password_hash) values ($1, extensions.crypt($2, extensions.gen_salt(''bf'')))',
    identity_col
  )
  using normalized_username, p_password;

  return normalized_username;
end;
$$;

create or replace function public.verify_login(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  identity_col text;
  normalized_username text;
  stored_hash text;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  execute format(
    'select password_hash from public.logins where %I = $1',
    identity_col
  )
  into stored_hash
  using normalized_username;

  if stored_hash is null then
    return false;
  end if;

  return stored_hash = extensions.crypt(p_password, stored_hash);
end;
$$;

create or replace function public.change_login_password(
  p_username text,
  p_old_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  identity_col text;
  normalized_username text;
  stored_hash text;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  execute format(
    'select password_hash from public.logins where %I = $1',
    identity_col
  )
  into stored_hash
  using normalized_username;

  if stored_hash is null then
    return false;
  end if;

  if stored_hash <> extensions.crypt(p_old_password, stored_hash) then
    return false;
  end if;

  execute format(
    'update public.logins set password_hash = extensions.crypt($1, extensions.gen_salt(''bf'')) where %I = $2',
    identity_col
  )
  using p_new_password, normalized_username;

  return true;
end;
$$;

create or replace function public.reset_login_password(
  p_username text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  identity_col text;
  normalized_username text;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  execute format(
    'update public.logins set password_hash = extensions.crypt($1, extensions.gen_salt(''bf'')) where %I = $2',
    identity_col
  )
  using p_password, normalized_username;
end;
$$;

grant usage on schema public to anon, authenticated;

grant execute on function public.create_login(text, text) to anon, authenticated;
grant execute on function public.verify_login(text, text) to anon, authenticated;
grant execute on function public.change_login_password(text, text, text) to anon, authenticated;
grant execute on function public.reset_login_password(text, text) to anon, authenticated;

alter function public._logins_identity_column() owner to postgres;
alter function public.create_login(text, text) owner to postgres;
alter function public.verify_login(text, text) owner to postgres;
alter function public.change_login_password(text, text, text) owner to postgres;
alter function public.reset_login_password(text, text) owner to postgres;
