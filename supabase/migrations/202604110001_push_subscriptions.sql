create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  login_code text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  language text not null default 'pt',
  user_agent text,
  enabled boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_login_code_idx
  on public.push_subscriptions (login_code);

alter table public.push_subscriptions enable row level security;
