-- Optional: schedule cleanup-race-photos edge function (hourly)
-- Requires pg_cron + pg_net extensions.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace <project-ref> with your Supabase project ref.
-- The function should be deployed as: cleanup-race-photos
select
  cron.schedule(
    'cleanup-race-photos',
    '0 * * * *',
    $$
    select
      net.http_post(
        url := 'https://<project-ref>.functions.supabase.co/cleanup-race-photos',
        headers := jsonb_build_object('Content-Type', 'application/json')
      );
    $$
  );
