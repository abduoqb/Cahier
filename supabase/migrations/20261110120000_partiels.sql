-- Historique des partiels blancs (une ligne par partiel). Synchro « le plus récent gagne » via updated_at ;
-- une suppression est une ligne deleted = true (tombstone), comme pour la table entites.
create table if not exists public.partiels (
    user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
    id         text    not null,
    matiere    text    not null,
    date       bigint  not null,                 -- début du partiel, millisecondes depuis 1970
    note       numeric(4, 2) not null check (note >= 0 and note <= 20),
    duree_s    integer not null check (duree_s >= 0),
    detail     jsonb   not null default '{}'::jsonb, -- { sujet, points, max, parQuestion[], parNotion{} } ; jamais les réponses
    updated_at bigint  not null,                 -- millisecondes depuis 1970
    deleted    boolean not null default false,
    primary key (user_id, id)
);

create index if not exists partiels_user_matiere_idx on public.partiels (user_id, matiere);

alter table public.partiels enable row level security;

create policy "partiels_select_own" on public.partiels for select to authenticated using (user_id = (select auth.uid()));
create policy "partiels_insert_own" on public.partiels for insert to authenticated with check (user_id = (select auth.uid()));
create policy "partiels_update_own" on public.partiels for update to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "partiels_delete_own" on public.partiels for delete to authenticated using (user_id = (select auth.uid()));

-- Événements temps réel (la synchro relance un cycle quand une autre fenêtre change quelque chose).
alter publication supabase_realtime add table public.partiels;
