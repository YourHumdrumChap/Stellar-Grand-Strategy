-- Star Sovereigns multiplayer lobby schema.
-- Run this in the Supabase SQL editor for https://vdurhudczavpcyehekhc.supabase.co.

create table if not exists public.stellar_lobbies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 64),
  passcode_hash text not null,
  seed bigint not null,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'playing', 'closed')),
  player_count integer not null default 1 check (player_count between 0 and 64),
  host_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stellar_lobbies enable row level security;

drop policy if exists "stellar_lobbies_select_open" on public.stellar_lobbies;
create policy "stellar_lobbies_select_open"
on public.stellar_lobbies
for select
to anon
using (status = 'open');

drop policy if exists "stellar_lobbies_insert_open" on public.stellar_lobbies;
create policy "stellar_lobbies_insert_open"
on public.stellar_lobbies
for insert
to anon
with check (status = 'open');

drop policy if exists "stellar_lobbies_update_open" on public.stellar_lobbies;
create policy "stellar_lobbies_update_open"
on public.stellar_lobbies
for update
to anon
using (status = 'open')
with check (status in ('open', 'playing', 'closed'));

create index if not exists stellar_lobbies_status_updated_idx
on public.stellar_lobbies (status, updated_at desc);
