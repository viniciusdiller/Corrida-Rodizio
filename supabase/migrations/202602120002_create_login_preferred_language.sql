-- Persist preferred language when creating custom login accounts.

alter table if exists public.logins
  add column if not exists preferred_language text;

create or replace function public.create_login(
  p_username text,
  p_password text,
  p_preferred_language text default null
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  identity_col text;
  normalized_username text;
  normalized_language text;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  if p_preferred_language is null then
    normalized_language := null;
  else
    normalized_language := lower(trim(p_preferred_language));
    if normalized_language not in ('pt', 'en', 'es', 'fr') then
      normalized_language := null;
    end if;
  end if;

  execute format(
    'insert into public.logins (%I, password_hash, preferred_language) values ($1, extensions.crypt($2, extensions.gen_salt(''bf'')), $3)',
    identity_col
  )
  using normalized_username, p_password, normalized_language;

  return normalized_username;
end;
$$;

grant execute on function public.create_login(text, text, text) to anon, authenticated;
alter function public.create_login(text, text, text) owner to postgres;
