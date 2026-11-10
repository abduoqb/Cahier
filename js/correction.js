// Correction des questions (logique pure, sans DOM) : chaque type renvoie un score entre 0 et 1.
// Réponse attendue de l'interface : qcm = indice du choix, courte = texte, trace = { variable: texte },
// ordre = éléments dans l'ordre choisi, redaction = tableau de booléens (un par critère du barème).
export const TYPES = ['qcm', 'courte', 'trace', 'ordre', 'redaction'];
export const SEUIL_REUSSITE = 0.5;

// mode « commande » : comparaison exacte après trim. mode « texte » : casse, accents, espaces et ponctuation finale ignorés.
export function normaliser(texte, mode = 'texte') {
    const t = String(texte ?? '');
    if (mode === 'commande') return t.trim();
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/\s+/g, ' ').trim().replace(/[\s.!?;:]+$/, '');
}

export const sansEspaces = t => String(t ?? '').replace(/\s+/g, '');

export function corrigerQcm(q, rep) {
    return rep === q.bonne ? 1 : 0;
}

export function corrigerCourte(q, rep) {
    if (typeof rep !== 'string') return 0;
    const mode = q.mode === 'commande' ? 'commande' : 'texte';
    const r = normaliser(rep, mode);
    if (!r) return 0;
    return (q.reponses || []).some(a => normaliser(a, mode) === r) ? 1 : 0;
}

export function corrigerTrace(q, rep) {
    const noms = Object.keys(q.attendu || {});
    if (!noms.length || !rep || typeof rep !== 'object') return 0;
    const justes = noms.filter(n => sansEspaces(rep[n]) === sansEspaces(q.attendu[n])).length;
    return justes / noms.length;
}

export function corrigerOrdre(q, rep) {
    const att = q.elements || [];
    if (!att.length || !Array.isArray(rep)) return 0;
    return att.filter((e, i) => rep[i] === e).length / att.length;
}

export function totalBareme(q) {
    return (q.bareme || []).reduce((s, c) => s + c.points, 0);
}

export function corrigerRedaction(q, rep) {
    const total = totalBareme(q);
    if (!total || !Array.isArray(rep)) return 0;
    return q.bareme.reduce((s, c, i) => s + (rep[i] === true ? c.points : 0), 0) / total;
}

const CORRECTEURS = { qcm: corrigerQcm, courte: corrigerCourte, trace: corrigerTrace, ordre: corrigerOrdre, redaction: corrigerRedaction };

// Une réponse absente (undefined) vaut 0. ok : la notion est considérée comme réussie (score d'au moins 0,5).
export function corriger(q, rep) {
    const f = CORRECTEURS[q.type || 'qcm'];
    const score = f && rep !== undefined && rep !== null ? f(q, rep) : 0;
    return { score, ok: score >= SEUIL_REUSSITE };
}

// Points maximum d'une question dans un partiel : barème pour une rédaction, sinon q.points (1 par défaut).
export function pointsQuestion(q) {
    return q.type === 'redaction' ? totalBareme(q) : (q.points ?? 1);
}

// Une rédaction se corrige en deux temps ; un correcteur IA (phase 3) aura cette forme et pré-cochera les critères.
// type Correcteur = async (question, texte) => ({ coches: boolean[], commentaire: string })
export const correcteurManuel = async q => ({ coches: (q.bareme || []).map(() => false), commentaire: '' });
