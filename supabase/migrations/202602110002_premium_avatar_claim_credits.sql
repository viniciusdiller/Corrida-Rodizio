alter table if exists public.player_profiles
  add column if not exists premium_avatar_claim_credits integer;

alter table if exists public.player_profiles
  alter column premium_avatar_claim_credits set default 1;

update public.player_profiles
set premium_avatar_claim_credits = 1
where premium_avatar_claim_credits is null
   or premium_avatar_claim_credits < 0;

insert into public.player_profiles (login_code, premium_avatar_claim_credits)
select l.username, 1
from public.logins l
left join public.player_profiles p on p.login_code = l.username
where p.login_code is null
on conflict (login_code)
do update set premium_avatar_claim_credits = coalesce(public.player_profiles.premium_avatar_claim_credits, 1);

alter table if exists public.player_profiles
  add constraint player_profiles_premium_avatar_claim_credits_nonnegative
  check (premium_avatar_claim_credits >= 0);
