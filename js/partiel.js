// Partiel blanc : construction du sujet, chrono, note, notions ratées, historique local et fusion pour la synchro.
// Tout est pur (aucun DOM) ; le stockage est injecté comme dans progress.js.
import { corriger, pointsQuestion } from './correction.js?v=1';
import { melanger, preparerQuestion } from './quiz-session.js?v=2';

export const SEUIL_NOTION = 0.5;
const K_PARTIELS = 'cahier.partiels.v1';
const K_ENCOURS = 'cahier.partiel.encours';

export const sujetsDe = questions => [...new Set(questions.map(q => q.sujet).filter(Boolean))];

// sujet nul : toutes les questions, mélangées. Sinon : les questions de ce sujet, dans l'ordre du fichier.
export function construireSujet(questions, { sujet = null, rng = Math.random } = {}) {
    const choisies = sujet ? questions.filter(q => q.sujet === sujet) : melanger(questions, rng);
    return choisies.map(q => preparerQuestion(q, rng));
}

export function tempsRestant(debut, dureeMin, now = Date.now()) {
    return Math.max(0, Math.round((debut + dureeMin * 60000 - now) / 1000));
}

export function formatDuree(secondes) {
    const s = Math.max(0, Math.round(secondes));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const d2 = n => String(n).padStart(2, '0');
    return h ? `${h}:${d2(m)}:${d2(r)}` : `${d2(m)}:${d2(r)}`;
}

const auQuart = x => Math.round(x * 4) / 4;

// reponses : { idQuestion: réponse }. Une question sans réponse vaut 0.
export function noterPartiel(questions, reponses) {
    const parQuestion = [];
    const parNotion = {};
    let points = 0, max = 0;
    for (const q of questions) {
        const m = pointsQuestion(q);
        const { score } = corriger(q, reponses[q.id]);
        const p = Math.round(score * m * 1000) / 1000;
        points += p; max += m;
        parQuestion.push({ id: q.id, points: p, max: m, score, seance: q.seance, notion: q.notion });
        const cle = `${q.seance}/${q.notion}`;
        const n = parNotion[cle] || (parNotion[cle] = { points: 0, max: 0 });
        n.points += p; n.max += m;
    }
    return { points, max, note20: max ? auQuart((points / max) * 20) : 0, parQuestion, parNotion };
}

export function notionsRatees(parNotion, seuil = SEUIL_NOTION) {
    return Object.entries(parNotion).filter(([, n]) => n.max > 0 && n.points / n.max < seuil).map(([cle]) => {
        const i = cle.indexOf('/');
        return { seanceId: cle.slice(0, i), notion: cle.slice(i + 1) };
    });
}

// Enregistrement de l'historique (une ligne de la table Supabase « partiels »). Pas de réponses : seulement les points.
export function creerEnregistrement({ id, matiere, sujet, date, dureeS, resultat }) {
    return {
        id, matiere, date, note: resultat.note20, duree_s: Math.round(dureeS),
        detail: { sujet: sujet || null, points: resultat.points, max: resultat.max,
            parQuestion: resultat.parQuestion.map(({ id: i, points: p, max: m, seance, notion }) => ({ id: i, points: p, max: m, seance, notion })),
            parNotion: resultat.parNotion },
        u: date, d: false,
    };
}

// « Le plus récent gagne » par id, suppressions comprises (même principe que les autres tables).
export function fusionnerPartiels(locaux, distants) {
    const fusion = { ...locaux };
    for (const [id, r] of Object.entries(distants)) {
        if (!fusion[id] || r.u > fusion[id].u) fusion[id] = r;
    }
    const aEnvoyer = Object.entries(fusion).filter(([id, e]) => e === locaux[id] && (!distants[id] || e.u > distants[id].u)).map(([id]) => id);
    return { fusion, aEnvoyer };
}

function memoire() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
function stockageParDefaut() {
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* accès refusé */ }
    return memoire();
}

export function createPartiels(storage = stockageParDefaut(), key = K_PARTIELS, keyEncours = K_ENCOURS) {
    const charger = () => {
        try {
            const d = JSON.parse(storage.getItem(key));
            return d && typeof d.partiels === 'object' && d.partiels ? d.partiels : {};
        } catch { return {}; }
    };
    const sauver = p => { try { storage.setItem(key, JSON.stringify({ partiels: p })); } catch { /* plein */ } };
    return {
        ajouter(rec) { const p = charger(); p[rec.id] = rec; sauver(p); },
        supprimer(id, now = Date.now()) {
            const p = charger();
            if (p[id]) { p[id] = { ...p[id], d: true, u: now }; sauver(p); }
        },
        lister(matiere) { return Object.values(charger()).filter(r => !r.d && r.matiere === matiere).sort((a, b) => b.date - a.date); },
        tous: charger,
        // Brouillon d'un partiel en cours : propre à l'appareil, jamais synchronisé, effacé quand la copie est rendue.
        brouillon() { try { return JSON.parse(storage.getItem(keyEncours)); } catch { return null; } },
        sauverBrouillon(b) { try { storage.setItem(keyEncours, JSON.stringify(b)); } catch { /* plein */ } },
        effacerBrouillon() { try { storage.removeItem(keyEncours); } catch { /* ignore */ } },
    };
}

export const partiels = createPartiels();
