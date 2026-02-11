create table if not exists public.premium_avatar_unlocks (
  id uuid primary key default gen_random_uuid(),
  login_code text not null,
  avatar text not null,
  claimed_from text not null default 'welcome_grid',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists premium_avatar_unlocks_login_avatar_idx
  on public.premium_avatar_unlocks (login_code, avatar);

create index if not exists premium_avatar_unlocks_login_code_idx
  on public.premium_avatar_unlocks (login_code);
