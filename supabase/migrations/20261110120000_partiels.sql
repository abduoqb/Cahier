-- Historique des partiels blancs (une ligne par partiel).
-- Synchro "le plus recent gagne" via updated_at ; une suppression = ligne deleted = true.
-- Script rejouable : on peut le relancer sans erreur.
create table if not exists public.partiels (
    user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
    id         text    not null,
    matiere    text    not null,
    date       bigint  not null,
    note       numeric(4, 2) not null check (note >= 0 and note <= 20),
    duree_s    integer not null check (duree_s >= 0),
    detail     jsonb   not null default '{}'::jsonb,
    updated_at bigint  not null,
    deleted    boolean not null default false,
    primary key (user_id, id)
);

create index if not exists partiels_user_matiere_idx on public.partiels (user_id, matiere);

alter table public.partiels enable row level security;

drop policy if exists "partiels_select_own" on public.partiels;
drop policy if exists "partiels_insert_own" on public.partiels;
drop policy if exists "partiels_update_own" on public.partiels;
drop policy if exists "partiels_delete_own" on public.partiels;

create policy "partiels_select_own" on public.partiels for select to authenticated using (user_id = (select auth.uid()));
create policy "partiels_insert_own" on public.partiels for insert to authenticated with check (user_id = (select auth.uid()));
create policy "partiels_update_own" on public.partiels for update to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "partiels_delete_own" on public.partiels for delete to authenticated using (user_id = (select auth.uid()));

-- Evenements temps reel (ignore si la table y est deja).
do $$
begin
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partiels') then
        alter publication supabase_realtime add table public.partiels;
    end if;
end $$;
