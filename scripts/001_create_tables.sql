-- Create races table
create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  food_type text not null check (food_type in ('pizza', 'sushi', 'burger')),
  created_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  is_active boolean default true
);

-- Create participants table
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  name text not null,
  items_eaten integer default 0 check (items_eaten >= 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.races enable row level security;
alter table public.participants enable row level security;

-- Create policies for races (everyone can read, insert, and update)
create policy "races_select_all"
  on public.races for select
  using (true);

create policy "races_insert_all"
  on public.races for insert
  with check (true);

create policy "races_update_all"
  on public.races for update
  using (true);

-- Create policies for participants (everyone can read, insert, and update)
create policy "participants_select_all"
  on public.participants for select
  using (true);

create policy "participants_insert_all"
  on public.participants for insert
  with check (true);

create policy "participants_update_all"
  on public.participants for update
  using (true);

-- Create index for faster queries
create index if not exists participants_race_id_idx on public.participants(race_id);
create index if not exists races_is_active_idx on public.races(is_active);

-- Create function to update participant updated_at timestamp
create or replace function update_participant_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating participant timestamp
drop trigger if exists update_participant_timestamp_trigger on public.participants;
create trigger update_participant_timestamp_trigger
  before update on public.participants
  for each row
  execute function update_participant_timestamp();
