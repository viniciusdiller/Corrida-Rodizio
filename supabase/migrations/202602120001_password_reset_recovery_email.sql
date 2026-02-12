-- Add optional recovery email + password reset code support for custom login accounts.

alter table if exists public.logins
  add column if not exists recovery_email text,
  add column if not exists password_reset_code_hash text,
  add column if not exists password_reset_expires_at timestamptz;

create unique index if not exists logins_recovery_email_unique_idx
  on public.logins (lower(recovery_email))
  where recovery_email is not null;

create or replace function public._logins_identity_column()
returns text
language plpgsql
as $$
declare
  identity_col text;
begin
  select case
    when exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'logins' and column_name = 'username'
    ) then 'username'
    when exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'logins' and column_name = 'code'
    ) then 'code'
    else null
  end into identity_col;

  if identity_col is null then
    raise exception 'public.logins must have either username or code column';
  end if;

  return identity_col;
end;
$$;


create or replace function public.get_login_recovery_email(
  p_username text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  identity_col text;
  normalized_username text := upper(trim(coalesce(p_username, '')));
  stored_email text;
begin
  if normalized_username = '' then
    return null;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'select recovery_email from public.logins where %I = $1',
    identity_col
  ) into stored_email using normalized_username;

  return stored_email;
end;
$$;

create or replace function public.set_login_recovery_email(
  p_username text,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  identity_col text;
  normalized_username text := upper(trim(coalesce(p_username, '')));
  normalized_email text := lower(trim(coalesce(p_email, '')));
  exists_target boolean := false;
begin
  if normalized_username = '' then
    return false;
  end if;

  if normalized_email = '' then
    return false;
  end if;

  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    return false;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'select exists(select 1 from public.logins where %I = $1)',
    identity_col
  ) into exists_target using normalized_username;

  if not exists_target then
    return false;
  end if;

  execute format(
    'update public.logins set recovery_email = $1 where %I = $2',
    identity_col
  ) using normalized_email, normalized_username;

  return true;
end;
$$;

create or replace function public.start_login_password_reset(
  p_username text,
  p_email text,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  identity_col text;
  normalized_username text := upper(trim(coalesce(p_username, '')));
  normalized_email text := lower(trim(coalesce(p_email, '')));
  normalized_code text := upper(trim(coalesce(p_code, '')));
  updated_rows integer := 0;
begin
  if normalized_username = '' or normalized_email = '' or length(normalized_code) <> 6 then
    return false;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'update public.logins
        set password_reset_code_hash = extensions.crypt($1, extensions.gen_salt(''bf'')),
            password_reset_expires_at = now() + interval ''15 minutes''
      where %I = $2 and lower(coalesce(recovery_email, '''')) = $3',
    identity_col
  ) using normalized_code, normalized_username, normalized_email;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

create or replace function public.finish_login_password_reset(
  p_username text,
  p_code text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  identity_col text;
  normalized_username text := upper(trim(coalesce(p_username, '')));
  normalized_code text := upper(trim(coalesce(p_code, '')));
  new_password text := coalesce(p_new_password, '');
  db_hash text;
begin
  if normalized_username = '' or length(normalized_code) <> 6 or length(new_password) < 6 then
    return false;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'select password_reset_code_hash from public.logins
      where %I = $1 and password_reset_expires_at > now()',
    identity_col
  ) into db_hash using normalized_username;

  if db_hash is null or extensions.crypt(normalized_code, db_hash) <> db_hash then
    return false;
  end if;

  execute format(
    'update public.logins
        set password_hash = extensions.crypt($1, extensions.gen_salt(''bf'')),
            password_reset_code_hash = null,
            password_reset_expires_at = null
      where %I = $2',
    identity_col
  ) using new_password, normalized_username;

  return true;
end;
$$;

grant execute on function public.get_login_recovery_email(text) to anon, authenticated;
grant execute on function public.set_login_recovery_email(text, text) to anon, authenticated;
grant execute on function public.start_login_password_reset(text, text, text) to anon, authenticated;
grant execute on function public.finish_login_password_reset(text, text, text) to anon, authenticated;
