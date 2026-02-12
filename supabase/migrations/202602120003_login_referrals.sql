-- Add invitation code support and referral premium credit bonus.

create table if not exists public.login_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_login_code text not null,
  referred_login_code text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists login_referrals_referrer_referred_idx
  on public.login_referrals (referrer_login_code, referred_login_code);

create index if not exists login_referrals_referrer_idx
  on public.login_referrals (referrer_login_code);

alter table public.login_referrals
  add constraint login_referrals_no_self_referral
  check (upper(referrer_login_code) <> upper(referred_login_code));

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
  referrer_exists boolean := false;
  referred_has_recovery_email boolean := false;
begin
  if normalized_referred = '' or normalized_referral = '' then
    return false;
  end if;

  if normalized_referred = normalized_referral then
    return false;
  end if;

  identity_col := public._logins_identity_column();

  execute format(
    'select exists(select 1 from public.logins where %I = $1)',
    identity_col
  ) into referrer_exists using normalized_referral;

  if not referrer_exists then
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
  values (normalized_referral, normalized_referred)
  on conflict (referred_login_code) do nothing;

  if not found then
    return false;
  end if;

  insert into public.player_profiles (login_code, premium_avatar_claim_credits)
  values (normalized_referred, 2)
  on conflict (login_code)
  do update set premium_avatar_claim_credits = greatest(coalesce(public.player_profiles.premium_avatar_claim_credits, 1) + 1, 0);

  insert into public.player_profiles (login_code, premium_avatar_claim_credits)
  values (normalized_referral, 2)
  on conflict (login_code)
  do update set premium_avatar_claim_credits = greatest(coalesce(public.player_profiles.premium_avatar_claim_credits, 1) + 1, 0);

  return true;
end;
$$;

grant execute on function public.apply_login_referral(text, text) to anon, authenticated;
alter function public.apply_login_referral(text, text) owner to postgres;
