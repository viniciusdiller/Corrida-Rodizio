-- Add photo_mode and race_photos table
alter table public.races
  add column if not exists photo_mode boolean not null default false;

create table if not exists public.race_photos (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  item_number integer not null,
  image_path text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.race_photos
  alter column expires_at set default (now() + interval '2 days');

update public.race_photos
set expires_at = created_at + interval '2 days'
where expires_at is null;

create index if not exists race_photos_race_created_idx
  on public.race_photos (race_id, created_at);

create index if not exists race_photos_participant_created_idx
  on public.race_photos (participant_id, created_at);
