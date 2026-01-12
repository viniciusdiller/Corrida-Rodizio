-- Add room_code to races table
alter table public.races add column if not exists room_code text unique;

-- Create index for room code lookups
create index if not exists races_room_code_idx on public.races(room_code);

-- Update policy to include room_code queries
drop policy if exists "races_select_all" on public.races;
create policy "races_select_all"
  on public.races for select
  using (true);
