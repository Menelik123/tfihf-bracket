-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Create the table
create table if not exists tournament_state (
  id int primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- 2. Auto-update timestamp
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tournament_state_updated_at on tournament_state;
create trigger tournament_state_updated_at
  before update on tournament_state
  for each row execute function set_updated_at();

-- 3. Enable Realtime
alter publication supabase_realtime add table tournament_state;

-- 4. RLS — open read/write with anon key (intentional: public camp scoreboard)
alter table tournament_state enable row level security;

drop policy if exists "public read" on tournament_state;
create policy "public read" on tournament_state
  for select using (true);

drop policy if exists "public write" on tournament_state;
create policy "public write" on tournament_state
  for all using (true) with check (true);
