-- Backfill referral_code for existing logins using:
-- first 3 alphanumeric chars of username/code + 4 random digits.

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

do $$
declare
  identity_col text;
  login_value text;
  generated_code text;
  attempt int;
  was_updated int;
begin
  identity_col := public._logins_identity_column();

  for login_value in execute format(
    'select %1$I from public.logins',
    identity_col
  )
  loop
    for attempt in 1..50 loop
      generated_code := public._generate_referral_code(login_value);
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
