// Synchronisation avec Supabase : le localStorage reste le cache de travail (le reste du site est synchrone),
// ce module le remplit à la connexion et envoie les changements en arrière-plan.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const URL = 'https://vjetheoocmmofwxlflzl.supabase.co';
const CLE = 'sb_publishable_LFh9DU4-8Nxpb80VDwZgXw_QKx0j1a5';

const K_PROGRESS = 'cahier.progress.v1';
const K_CARTES = 'cahier.cartes.v1';
const K_STORE = 'suivit_cours_data';
const K_ICS = 'cahier_ics';
const K_AGENDA = 'cahier_agenda_collapsed';
const CLES_LOCALES = [K_PROGRESS, K_CARTES, K_STORE, K_ICS, K_AGENDA];

export const supabase = createClient(URL, CLE);

const lire = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* plein */ } };
const fusion = (a, b, champ) => (!a ? b : !b ? a : (a[champ] >= b[champ] ? a : b));

let userId = null;
let envoiEnCours = null;
let delai = null;
const dejaEnvoye = new Map(); // clé locale -> JSON déjà poussé

async function verifier(res, quoi) {
    if (res.error) throw new Error(`${quoi} : ${res.error.message}`);
    return res.data;
}

// --- Lignes <-> blobs locaux ---

function lignesNotions(d) {
    return Object.entries((d && d.notions) || {}).map(([id, r]) => {
        const i = id.indexOf('/');
        return { user_id: userId, seance_id: id.slice(0, i), notion: id.slice(i + 1), n: r.n, last: r.last,
            last_success: r.lastSuccess, acquise_le: r.acquiseLe, palier: r.palier, revoir: r.revoir };
    });
}

function lignesCartes(d) {
    return Object.entries((d && d.cartes) || {}).map(([id, r]) =>
        ({ user_id: userId, carte_id: id, boite: r.boite, prochaine: r.prochaine, vue: r.vue }));
}

async function pousser(cle) {
    if (!userId) return;
    const brut = localStorage.getItem(cle);
    if (brut === dejaEnvoye.get(cle)) return;
    const d = lire(cle);
    if (cle === K_PROGRESS) {
        const lignes = lignesNotions(d);
        if (lignes.length) await verifier(await supabase.from('notion_progress').upsert(lignes), 'notions');
    } else if (cle === K_CARTES) {
        const lignes = lignesCartes(d);
        if (lignes.length) await verifier(await supabase.from('carte_etat').upsert(lignes), 'cartes');
        const nv = d && d.nouvelles;
        if (nv && nv.jour) await verifier(await supabase.from('nouvelles_jour').upsert({ user_id: userId, jour: nv.jour, n: nv.n }), 'nouvelles');
    } else {
        const cle_app = { [K_STORE]: 'store', [K_ICS]: 'ics', [K_AGENDA]: 'agenda' }[cle];
        const valeur = cle === K_ICS ? { texte: brut } : cle === K_AGENDA ? { replie: brut === '1' } : d;
        if (brut === null) await verifier(await supabase.from('app_data').delete().eq('key', cle_app), 'suppression');
        else await verifier(await supabase.from('app_data').upsert({ user_id: userId, key: cle_app, value: valeur, updated_at: new Date().toISOString() }), cle_app);
    }
    dejaEnvoye.set(cle, brut);
}

const enAttente = new Set();
function planifier(cle) {
    enAttente.add(cle);
    clearTimeout(delai);
    delai = setTimeout(vider, 1200);
}

async function vider() {
    if (envoiEnCours) { await envoiEnCours; }
    const cles = [...enAttente];
    enAttente.clear();
    envoiEnCours = (async () => {
        for (const c of cles) {
            try { await pousser(c); } catch (e) { console.warn('Sync :', e.message); enAttente.add(c); }
        }
    })();
    await envoiEnCours;
    envoiEnCours = null;
    if (enAttente.size) delai = setTimeout(vider, 15000);
}

// Surveille les écritures du site sur les clés synchronisées.
function surveillerStockage() {
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) {
        setItem.call(this, k, v);
        if (this === localStorage && CLES_LOCALES.includes(k)) planifier(k);
    };
    Storage.prototype.removeItem = function (k) {
        removeItem.call(this, k);
        if (this === localStorage && CLES_LOCALES.includes(k)) planifier(k);
    };
    addEventListener('cahier:reponse', async e => {
        const r = e.detail;
        try { await supabase.from('reponses').insert({ seance_id: r.seanceId, notion: r.notion, question_id: r.questionId ?? null, ok: r.ok }); }
        catch { /* journal non critique */ }
    });
    addEventListener('pagehide', () => { if (enAttente.size) vider(); });
}

// --- Tirage à la connexion, fusionné avec le local ---

async function tirer() {
    const [notions, cartes, nv, app] = await Promise.all([
        supabase.from('notion_progress').select('*'),
        supabase.from('carte_etat').select('*'),
        supabase.from('nouvelles_jour').select('*').order('jour', { ascending: false }).limit(1),
        supabase.from('app_data').select('key,value'),
    ]).then(rs => Promise.all(rs.map((r, i) => verifier(r, ['notions', 'cartes', 'nouvelles', 'app_data'][i]))));

    const locP = lire(K_PROGRESS) || { notions: {} };
    const mergedN = { ...(locP.notions || {}) };
    for (const r of notions) {
        const rec = { n: r.n, last: r.last, lastSuccess: r.last_success, acquiseLe: r.acquise_le, palier: r.palier, revoir: r.revoir };
        const id = `${r.seance_id}/${r.notion}`;
        mergedN[id] = fusion(mergedN[id], rec, 'last');
    }
    ecrire(K_PROGRESS, { notions: mergedN });

    const locC = lire(K_CARTES) || { cartes: {}, nouvelles: { jour: '', n: 0 } };
    const mergedC = { ...(locC.cartes || {}) };
    for (const r of cartes) mergedC[r.carte_id] = fusion(mergedC[r.carte_id], { boite: r.boite, prochaine: r.prochaine, vue: r.vue }, 'vue');
    let nouvelles = locC.nouvelles || { jour: '', n: 0 };
    if (nv[0] && nv[0].jour >= nouvelles.jour) nouvelles = nv[0].jour === nouvelles.jour ? { jour: nv[0].jour, n: Math.max(nv[0].n, nouvelles.n) } : { jour: nv[0].jour, n: nv[0].n };
    ecrire(K_CARTES, { cartes: mergedC, nouvelles });

    for (const { key, value } of app) {
        if (key === 'store' && !localStorage.getItem(K_STORE)) ecrire(K_STORE, value);
        if (key === 'ics' && !localStorage.getItem(K_ICS)) ecrire(K_ICS, value.texte);
        if (key === 'agenda' && localStorage.getItem(K_AGENDA) === null) ecrire(K_AGENDA, value.replie ? '1' : '0');
    }
    // Premier lancement ou données locales plus récentes : tout repartir vers le serveur.
    for (const c of CLES_LOCALES) if (localStorage.getItem(c) !== null) planifier(c);
}

// --- API publique ---

export async function sessionActive() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function seConnecter(email, motDePasse) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) throw new Error('Email ou mot de passe incorrect.');
}

export async function seDeconnecter() {
    await vider().catch(() => {});
    userId = null; // plus d'envoi : le nettoyage local ne doit rien supprimer sur le serveur
    enAttente.clear();
    await supabase.auth.signOut();
    for (const c of CLES_LOCALES) { try { localStorage.removeItem(c); } catch { /* ignore */ } }
    location.reload();
}

export async function demarrerSync(session) {
    userId = session.user.id;
    surveillerStockage();
    try { await tirer(); } catch (e) { console.warn('Sync : tirage impossible, mode hors ligne.', e.message); }
}
