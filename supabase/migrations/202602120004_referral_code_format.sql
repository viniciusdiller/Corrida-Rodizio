-- Add dedicated referral codes based on username prefix + 4 random digits.

alter table if exists public.logins
  add column if not exists referral_code text;

create unique index if not exists logins_referral_code_unique_idx
  on public.logins (referral_code)
  where referral_code is not null;

create or replace function public._generate_referral_code(p_username text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_base text;
begin
  normalized_base := upper(regexp_replace(trim(coalesce(p_username, '')), '[^a-zA-Z0-9]', '', 'g'));
  normalized_base := substr(normalized_base, 1, 3);
  normalized_base := rpad(normalized_base, 3, 'X');

  return normalized_base || lpad((floor(random() * 10000))::int::text, 4, '0');
end;
$$;

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
  candidate_referral_code text;
  login_exists boolean := false;
  attempt int;
begin
  identity_col := public._logins_identity_column();
  normalized_username := upper(trim(p_username));

  execute format(
    'select exists(select 1 from public.logins where %I = $1)',
    identity_col
  ) into login_exists using normalized_username;

  if login_exists then
    raise exception 'login already exists';
  end if;

  if p_preferred_language is null then
    normalized_language := null;
  else
    normalized_language := lower(trim(p_preferred_language));
    if normalized_language not in ('pt', 'en', 'es', 'fr') then
      normalized_language := null;
    end if;
  end if;

  for attempt in 1..50 loop
    candidate_referral_code := public._generate_referral_code(normalized_username);

    begin
      execute format(
        'insert into public.logins (%I, password_hash, preferred_language, referral_code) values ($1, extensions.crypt($2, extensions.gen_salt(''bf'')), $3, $4)',
        identity_col
      )
      using normalized_username, p_password, normalized_language, candidate_referral_code;

      return normalized_username;
    exception
      when unique_violation then
        if attempt = 50 then
          raise exception 'could not generate unique referral code';
        end if;
    end;
  end loop;

  raise exception 'could not create login';
end;
$$;

create or replace function public.apply_login_referral(
  p_referred_login_code text,
  p_referral_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_referred text := upper(trim(coalesce(p_referred_login_code, '')));
  normalized_referral text := upper(trim(coalesce(p_referral_code, '')));
  identity_col text;
  referrer_login_code text;
  referred_has_recovery_email boolean := false;
begin
  if normalized_referred = '' or normalized_referral = '' then
    return false;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'select %1$I from public.logins where referral_code = $1 or %1$I = $1 limit 1',
    identity_col
  ) into referrer_login_code using normalized_referral;

  if referrer_login_code is null then
    return false;
  end if;

  if normalized_referred = upper(referrer_login_code) then
    return false;
  end if;

  execute format(
    'select coalesce(recovery_email, '''') <> '''' from public.logins where %I = $1',
    identity_col
  ) into referred_has_recovery_email using normalized_referred;

  if coalesce(referred_has_recovery_email, false) = false then
    return false;
  end if;

  insert into public.login_referrals (referrer_login_code, referred_login_code)
  values (upper(referrer_login_code), normalized_referred)
  on conflict (referred_login_code) do nothing;

  if not found then
    return false;
  end if;

  insert into public.player_profiles (login_code, premium_avatar_claim_credits)
  values (normalized_referred, 2)
  on conflict (login_code)
  do update set premium_avatar_claim_credits = greatest(coalesce(public.player_profiles.premium_avatar_claim_credits, 1) + 1, 0);

  insert into public.player_profiles (login_code, premium_avatar_claim_credits)
  values (upper(referrer_login_code), 2)
  on conflict (login_code)
  do update set premium_avatar_claim_credits = greatest(coalesce(public.player_profiles.premium_avatar_claim_credits, 1) + 1, 0);

  return true;
end;
$$;

do $$
declare
  identity_col text;
  login_value text;
  current_referral_code text;
  generated_code text;
  attempt int;
  was_updated int;
begin
  identity_col := public._logins_identity_column();

  for login_value, current_referral_code in execute format(
    'select %1$I, referral_code from public.logins',
    identity_col
  )
  loop
    for attempt in 1..50 loop
      generated_code := public._generate_referral_code(login_value);

      if upper(generated_code) = upper(coalesce(current_referral_code, ''))
         or upper(generated_code) = upper(coalesce(login_value, '')) then
        continue;
      end if;

      begin
        execute format(
          'update public.logins set referral_code = $1 where %1$I = $2',
          identity_col
        ) using generated_code, login_value;

        get diagnostics was_updated = row_count;

        if was_updated > 0 then
          exit;
        end if;
      exception
        when unique_violation then
          if attempt = 50 then
            raise exception 'could not assign unique referral code for %', login_value;
          end if;
      end;
    end loop;
  end loop;
end $$;

grant execute on function public._generate_referral_code(text) to anon, authenticated;
grant execute on function public.create_login(text, text, text) to anon, authenticated;
grant execute on function public.apply_login_referral(text, text) to anon, authenticated;

alter function public._generate_referral_code(text) owner to postgres;
alter function public.create_login(text, text, text) owner to postgres;
alter function public.apply_login_referral(text, text) owner to postgres;
