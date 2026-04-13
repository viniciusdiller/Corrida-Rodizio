alter table public.admin_notification_campaigns
  add column if not exists repeat_type text not null default 'none',
  add column if not exists repeat_start_at timestamptz,
  add column if not exists repeat_end_at timestamptz,
  add column if not exists repeat_day_of_month integer;

create index if not exists admin_notification_campaigns_repeat_idx
  on public.admin_notification_campaigns (status, repeat_type, scheduled_for);
