alter table public.races
  add column if not exists photo_required boolean not null default false;

update public.races
set photo_required = photo_mode
where photo_required is distinct from photo_mode;
