// Accès aux fichiers de contenu/ (nécessite un serveur HTTP, pas file://).
const BASE = 'contenu/';
let indexPromise = null;

export function slug(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function lire(chemin, type) {
    let res;
    try { res = await fetch(BASE + chemin); } catch { throw new Error('serveur'); }
    if (!res.ok) throw new Error(`Fichier introuvable : ${chemin}`);
    return type === 'json' ? res.json() : res.text();
}

export function chargerIndex() {
    indexPromise ??= lire('index.json', 'json').catch(e => { indexPromise = null; throw e; });
    return indexPromise;
}
export const chargerQuiz = (dossier) => lire(`${dossier}/quiz.json`, 'json');
export const chargerCartes = (dossier) => lire(`${dossier}/cartes.json`, 'json');
export async function existe(chemin) {
    try { return (await fetch(BASE + chemin, { method: 'HEAD' })).ok; } catch { return false; }
}
export const chargerTexte = (chemin) => lire(chemin, 'text');

export async function trouverMatiere(nom) {
    const idx = await chargerIndex();
    return idx.matieres.find(m => m.id === slug(nom)) || null;
}

export function messageErreur(e) {
    return e.message === 'serveur'
        ? 'Impossible de lire le contenu. Lance le serveur depuis le dossier du site : python -m http.server 8000, puis ouvre http://localhost:8000.'
        : e.message;
}
