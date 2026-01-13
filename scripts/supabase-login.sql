-- Supabase schema updates for login codes and account verification

create extension if not exists pgcrypto;

create table if not exists public.logins (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.participants
  add column if not exists login_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'participants_login_code_fkey'
  ) then
    alter table public.participants
      add constraint participants_login_code_fkey
      foreign key (login_code)
      references public.logins (code)
      on delete set null;
  end if;
end $$;

create or replace function public.create_login(p_code text, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.logins (code, password_hash)
  values (upper(p_code), crypt(p_password, gen_salt('bf')));
  return upper(p_code);
end;
$$;

create or replace function public.verify_login(p_code text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  select password_hash
    into stored_hash
    from public.logins
    where code = upper(p_code);

  if stored_hash is null then
    return false;
  end if;

  return stored_hash = crypt(p_password, stored_hash);
end;
$$;

grant execute on function public.create_login(text, text) to anon, authenticated;
grant execute on function public.verify_login(text, text) to anon, authenticated;

grant usage on schema public to anon, authenticated;

alter function public.create_login(text, text) owner to postgres;
alter function public.verify_login(text, text) owner to postgres;

create index if not exists participants_login_code_idx
  on public.participants (login_code);
