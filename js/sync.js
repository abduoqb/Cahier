// Synchronisation avec Supabase. Le localStorage reste le cache de travail (le reste du site est synchrone) ;
// chaque « cycle » récupère le serveur, fusionne par ligne (la plus récente gagne, suppressions comprises),
// écrit le résultat en local puis envoie ce qui est plus récent chez nous. Un cycle est idempotent :
// on le relance à chaque changement local, à chaque événement temps réel, au retour sur l'onglet et toutes les minutes.
import { Store } from './store.js';
import { canon, hash, aplatir, reconstruire } from './sync-merge.js';

const URL = 'https://vjetheoocmmofwxlflzl.supabase.co';
const CLE = 'sb_publishable_LFh9DU4-8Nxpb80VDwZgXw_QKx0j1a5';

const K_PROGRESS = 'cahier.progress.v1';
const K_CARTES = 'cahier.cartes.v1';
const K_STORE = 'suivit_cours_data';
const K_ICS = 'cahier_ics';
const K_BASE = 'cahier.sync.base'; // état du store à la dernière synchro : { id: { u, d, h, k, p } }
const K_META = 'cahier.sync.meta'; // dates de modification locales (agenda)
const K_FICHIERS = 'cahier.sync.files'; // ids de fichiers déjà envoyés
const SURVEILLES = [K_PROGRESS, K_CARTES, K_STORE, K_ICS];
const CLES_LOCALES = [...SURVEILLES, K_BASE, K_META, K_FICHIERS];

// supabase-js 2.45.4, hébergé dans js/vendor (chargé par index.html) : aucun CDN externe.
export const supabase = globalThis.supabase.createClient(URL, CLE);

const lire = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
let interne = false; // vrai pendant nos propres écritures locales, pour ne pas relancer de cycle
function ecrire(k, v) {
    interne = true;
    try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* plein */ } finally { interne = false; }
}
function retirer(k) {
    interne = true;
    try { localStorage.removeItem(k); } catch { /* ignore */ } finally { interne = false; }
}

let userId = null;
let enCours = false;
let relancer = false;
let delai = null;
let modifie = false; // des données locales ont changé à cause du serveur

function etat(nom) {
    const el = document.getElementById('sync-etat');
    if (!el) return;
    const textes = { ok: 'Synchronisé', sync: 'Synchronisation…', 'hors-ligne': 'Hors ligne, en attente', erreur: 'Erreur de synchro, nouvel essai' };
    el.dataset.etat = nom;
    el.textContent = textes[nom] || '';
}

async function verifier(res, quoi) {
    if (res.error) throw new Error(`${quoi} : ${res.error.message}`);
    return res.data;
}

async function toutLire(table, colonnes = '*') {
    const out = [];
    for (let debut = 0; ; debut += 1000) {
        const lot = await verifier(await supabase.from(table).select(colonnes).range(debut, debut + 999), table);
        out.push(...lot);
        if (lot.length < 1000) return out;
    }
}

async function envoyer(table, lignes, conflit) {
    for (let i = 0; i < lignes.length; i += 500) {
        await verifier(await supabase.from(table).upsert(lignes.slice(i, i + 500), conflit ? { onConflict: conflit } : undefined), table);
    }
}


// --- Matières, examens, checklists, catégories, éléments : une entité par ligne ---

async function cycleStore() {
    const base = lire(K_BASE) || {};
    const distant = new Map((await toutLire('entites')).map(r => [r.id, { kind: r.kind, parent: r.parent, data: r.data, u: Number(r.updated_at), d: r.deleted }]));

    // À partir d'ici, plus d'attente : aucune modification de l'utilisateur ne peut s'intercaler.
    const donnees = lire(K_STORE) || { subjects: [] };
    const local = aplatir(donnees);
    const maintenant = Date.now();
    const courant = new Map();
    for (const [id, e] of local) {
        const b = base[id];
        courant.set(id, { ...e, u: b && !b.d && b.h === hash(e) ? b.u : maintenant, d: false });
    }
    for (const [id, b] of Object.entries(base)) {
        if (local.has(id)) continue;
        courant.set(id, b.d ? { kind: b.k, parent: b.p, data: {}, u: b.u, d: true } : { kind: b.k, parent: b.p, data: {}, u: maintenant, d: true });
    }

    const fusion = new Map();
    const aEnvoyer = [];
    for (const id of new Set([...courant.keys(), ...distant.keys()])) {
        const l = courant.get(id);
        const r = distant.get(id);
        const gagnant = !r ? l : !l ? r : (l.u > r.u ? l : r);
        fusion.set(id, gagnant);
        if (l && gagnant === l && (!r || l.u > r.u)) {
            aEnvoyer.push({ user_id: userId, id, kind: l.kind, parent: l.parent, data: l.data, updated_at: l.u, deleted: l.d });
        }
    }

    const nouveau = reconstruire(fusion, donnees);
    if (canon(nouveau) !== canon(donnees)) { ecrire(K_STORE, nouveau); modifie = true; }
    const nouvelleBase = {};
    for (const [id, e] of fusion) nouvelleBase[id] = { u: e.u, d: e.d, h: hash(e), k: e.kind, p: e.parent };
    ecrire(K_BASE, nouvelleBase);
    // La base est enregistrée avant l'envoi : un échec laisse les lignes plus récentes que le serveur, elles repartiront.
    await envoyer('entites', aEnvoyer);
}

// --- Progression des notions et des cartes ---

async function cycleProgression() {
    const [notions, cartes, nv] = await Promise.all([
        toutLire('notion_progress'), toutLire('carte_etat'),
        supabase.from('nouvelles_jour').select('*').order('jour', { ascending: false }).limit(1).then(r => verifier(r, 'nouvelles')),
    ]);

    const locP = lire(K_PROGRESS) || { notions: {} };
    const mergedN = { ...(locP.notions || {}) };
    const montN = [];
    const distN = new Map(notions.map(r => [`${r.seance_id}/${r.notion}`, r]));
    for (const [id, r] of distN) {
        if (!mergedN[id] || r.last > mergedN[id].last) {
            mergedN[id] = { n: r.n, last: Number(r.last), lastSuccess: r.last_success, acquiseLe: r.acquise_le, palier: r.palier, revoir: r.revoir };
        }
    }
    for (const [id, rec] of Object.entries(mergedN)) {
        const r = distN.get(id);
        if (r && Number(r.last) >= rec.last) continue;
        const i = id.indexOf('/');
        montN.push({ user_id: userId, seance_id: id.slice(0, i), notion: id.slice(i + 1), n: rec.n, last: rec.last,
            last_success: rec.lastSuccess, acquise_le: rec.acquiseLe, palier: rec.palier, revoir: rec.revoir });
    }
    if (canon(mergedN) !== canon(locP.notions || {})) { ecrire(K_PROGRESS, { notions: mergedN }); modifie = true; }

    const locC = lire(K_CARTES) || { cartes: {}, nouvelles: { jour: '', n: 0 } };
    const mergedC = { ...(locC.cartes || {}) };
    const distC = new Map(cartes.map(r => [r.carte_id, r]));
    for (const [id, r] of distC) {
        if (!mergedC[id] || r.vue > mergedC[id].vue) mergedC[id] = { boite: r.boite, prochaine: Number(r.prochaine), vue: Number(r.vue) };
    }
    const montC = [];
    for (const [id, rec] of Object.entries(mergedC)) {
        const r = distC.get(id);
        if (r && Number(r.vue) >= rec.vue) continue;
        montC.push({ user_id: userId, carte_id: id, boite: rec.boite, prochaine: rec.prochaine, vue: rec.vue });
    }
    let nouvelles = locC.nouvelles || { jour: '', n: 0 };
    const rn = nv[0];
    if (rn) {
        if (rn.jour > nouvelles.jour) nouvelles = { jour: rn.jour, n: rn.n };
        else if (rn.jour === nouvelles.jour && rn.n > nouvelles.n) nouvelles = { jour: rn.jour, n: rn.n };
    }
    if (canon({ cartes: mergedC, nouvelles }) !== canon({ cartes: locC.cartes || {}, nouvelles: locC.nouvelles || { jour: '', n: 0 } })) {
        ecrire(K_CARTES, { cartes: mergedC, nouvelles }); modifie = true;
    }

    await envoyer('notion_progress', montN);
    await envoyer('carte_etat', montC);
    if (nouvelles.jour && (!rn || nouvelles.jour > rn.jour || (nouvelles.jour === rn.jour && nouvelles.n > rn.n))) {
        await envoyer('nouvelles_jour', [{ user_id: userId, jour: nouvelles.jour, n: nouvelles.n }]);
    }
}

// --- Agenda .ics (une valeur, la plus récente gagne) ---

async function cycleAgenda() {
    const lignes = await verifier(await supabase.from('app_data').select('key,value'), 'app_data');
    const anciennes = lignes.filter(l => l.key === 'store' || l.key === 'agenda').map(l => l.key);
    if (anciennes.length) await supabase.from('app_data').delete().in('key', anciennes); // restes de l'ancien format

    const meta = lire(K_META) || {};
    const courant = localStorage.getItem(K_ICS);
    if ((meta.ics ?? null) !== courant) { meta.ics = courant; meta.icsU = Date.now(); ecrire(K_META, meta); }
    const r = lignes.find(l => l.key === 'ics');
    const ru = r && r.value ? Number(r.value.u) || 0 : 0;
    if (ru > (meta.icsU || 0)) {
        if (r.value.texte === null) retirer(K_ICS); else ecrire(K_ICS, r.value.texte);
        meta.ics = r.value.texte; meta.icsU = ru; ecrire(K_META, meta); modifie = true;
    } else if ((meta.icsU || 0) > ru) {
        await envoyer('app_data', [{ user_id: userId, key: 'ics', value: { texte: courant, u: meta.icsU }, updated_at: new Date().toISOString() }], 'user_id,key');
    }
}

// --- Fichiers joints (Storage privé, un dossier par utilisateur) ---

function idsFichiers() {
    const ids = new Set();
    for (const s of (lire(K_STORE) || {}).subjects || []) {
        for (const c of s.categories || []) for (const it of c.items || []) if (it.fileId) ids.add(it.fileId);
    }
    return ids;
}

async function cycleFichiers() {
    if (!lire(K_STORE)) return;
    const voulus = idsFichiers();
    const envoyes = new Set(lire(K_FICHIERS) || []);
    for (const id of voulus) {
        const local = await Store.getFile(id);
        if (local && !envoyes.has(id)) {
            const blob = local.blob;
            await verifier(await supabase.storage.from('fichiers').upload(`${userId}/${id}`, blob, { upsert: true, contentType: local.type || blob.type || 'application/octet-stream' }), 'envoi fichier');
            await envoyer('app_data', [{ user_id: userId, key: `file:${id}`, value: { name: local.name, type: local.type || '' }, updated_at: new Date().toISOString() }], 'user_id,key');
            envoyes.add(id);
        } else if (!local) {
            const { data: blob, error } = await supabase.storage.from('fichiers').download(`${userId}/${id}`);
            if (error || !blob) { console.warn('Fichier introuvable sur le serveur :', id); continue; }
            const { data: meta } = await supabase.from('app_data').select('value').eq('key', `file:${id}`).maybeSingle();
            const nom = (meta && meta.value && meta.value.name) || id;
            const type = (meta && meta.value && meta.value.type) || blob.type;
            await Store.saveFile(id, new File([blob], nom, { type }));
            envoyes.add(id);
        }
    }
    const orphelins = [...envoyes].filter(id => !voulus.has(id));
    if (orphelins.length) {
        await supabase.storage.from('fichiers').remove(orphelins.map(id => `${userId}/${id}`));
        await supabase.from('app_data').delete().in('key', orphelins.map(id => `file:${id}`));
        orphelins.forEach(id => envoyes.delete(id));
    }
    ecrire(K_FICHIERS, [...envoyes]);
}

// --- Orchestration ---

async function cycle() {
    if (!userId) return;
    if (enCours) { relancer = true; return; }
    enCours = true;
    etat('sync');
    try {
        do {
            relancer = false;
            await cycleStore();
            await cycleProgression();
            await cycleAgenda();
            await cycleFichiers();
        } while (relancer);
        etat('ok');
        if (modifie) { modifie = false; dispatchEvent(new CustomEvent('cahier:synced')); }
    } catch (e) {
        console.warn('Sync :', e.message);
        etat(navigator.onLine ? 'erreur' : 'hors-ligne');
        planifier(15000);
    } finally {
        enCours = false;
    }
}

function planifier(ms = 1200) {
    clearTimeout(delai);
    delai = setTimeout(cycle, ms);
}

function surveiller() {
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) {
        setItem.call(this, k, v);
        if (this === localStorage && !interne && SURVEILLES.includes(k)) planifier();
    };
    Storage.prototype.removeItem = function (k) {
        removeItem.call(this, k);
        if (this === localStorage && !interne && SURVEILLES.includes(k)) planifier();
    };
    // Le site écrit les fichiers dans IndexedDB : on les envoie quand le store change (ajout d'un fichier = setItemFile).
    addEventListener('cahier:reponse', async e => {
        const r = e.detail;
        const res = await supabase.from('reponses').insert({ seance_id: r.seanceId, notion: r.notion, question_id: r.questionId ?? null, ok: r.ok });
        if (res.error) console.warn('Journal des réponses :', res.error.message);
    });
    addEventListener('online', () => planifier(300));
    addEventListener('offline', () => etat('hors-ligne'));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') planifier(300); else clearTimeout(delai), cycle(); });
    addEventListener('pagehide', () => { cycle(); });
    setInterval(() => planifier(0), 60000);
    supabase.channel('cahier').on('postgres_changes', { event: '*', schema: 'public' }, () => planifier(400)).subscribe();
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
    clearTimeout(delai);
    if (userId && !enCours) await cycle().catch(() => {}); // dernier envoi avant de vider l'appareil
    userId = null;
    await supabase.auth.signOut();
    for (const c of CLES_LOCALES) retirer(c);
    try { const dbs = await indexedDB.databases(); for (const d of dbs) if (d.name === 'suivit_cours_files') indexedDB.deleteDatabase(d.name); } catch { /* ignore */ }
    location.reload();
}

export async function demarrerSync(session) {
    userId = session.user.id;
    surveiller();
    // Avant d'afficher le site : les données du serveur sont déjà là (8 s maximum si le réseau traîne).
    await Promise.race([cycle(), new Promise(r => setTimeout(r, 8000))]);
}
