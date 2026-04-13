create extension if not exists pgcrypto;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  login_code text not null,
  kind text not null default 'admin',
  title text not null,
  body text,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_notifications_login_created_idx
  on public.user_notifications (login_code, created_at desc);

create index if not exists user_notifications_login_unread_idx
  on public.user_notifications (login_code, is_read, created_at desc);

create table if not exists public.admin_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  href text,
  target_type text not null,
  target_login_code text,
  template_key text,
  deliver_in_app boolean not null default true,
  deliver_push boolean not null default false,
  status text not null default 'draft',
  scheduled_for timestamptz,
  matched_count integer not null default 0,
  in_app_count integer not null default 0,
  push_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_notification_campaigns_status_scheduled_idx
  on public.admin_notification_campaigns (status, scheduled_for);

create index if not exists admin_notification_campaigns_created_idx
  on public.admin_notification_campaigns (created_at desc);
