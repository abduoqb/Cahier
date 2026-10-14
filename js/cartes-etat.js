// Calendrier des flashcards : boîtes de Leitner (1, 3, 7, 14, 30 jours), 10 nouvelles cartes par jour.
const DAY = 24 * 60 * 60 * 1000;
export const BOITES = [1, 3, 7, 14, 30];
export const NOUVELLES_PAR_JOUR = 10;
const KEY = 'cahier.cartes.v1';

function memoryStorage() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function defaultStorage() {
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* accès refusé */ }
    return memoryStorage();
}

export function jourLocal(now) {
    const d = new Date(now);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function createCartes(storage = defaultStorage(), key = KEY) {
    const num = v => typeof v === 'number' && Number.isFinite(v);
    function valide(r) {
        return !!r && typeof r === 'object' && !Array.isArray(r)
            && Number.isInteger(r.boite) && r.boite >= 1 && r.boite <= BOITES.length
            && num(r.prochaine) && num(r.vue);
    }
    function load() {
        const vide = { cartes: {}, nouvelles: { jour: '', n: 0 } };
        try {
            const d = JSON.parse(storage.getItem(key));
            if (!d || typeof d !== 'object') return vide;
            const cartes = {};
            if (d.cartes && typeof d.cartes === 'object') {
                for (const [id, r] of Object.entries(d.cartes)) if (valide(r)) cartes[id] = r;
            }
            const nv = d.nouvelles;
            const nouvelles = nv && typeof nv === 'object' && typeof nv.jour === 'string' && Number.isInteger(nv.n) && nv.n >= 0
                ? { jour: nv.jour, n: nv.n } : { jour: '', n: 0 };
            return { cartes, nouvelles };
        } catch { return vide; }
    }
    function save(d) {
        try { storage.setItem(key, JSON.stringify(d)); } catch { /* stockage plein ou refusé */ }
    }

    function getCarte(id) {
        return load().cartes[id] || null;
    }

    function noter(id, ok, now = Date.now()) {
        const d = load();
        const rec = d.cartes[id];
        if (!rec) {
            const jour = jourLocal(now);
            d.nouvelles = d.nouvelles.jour === jour ? { jour, n: d.nouvelles.n + 1 } : { jour, n: 1 };
        }
        const boite = ok ? Math.min((rec ? rec.boite : 1) + 1, BOITES.length) : 1;
        d.cartes[id] = { boite, prochaine: now + BOITES[boite - 1] * DAY, vue: now };
        save(d);
    }

    function cartesDues(ids, now = Date.now()) {
        const { cartes } = load();
        return ids.filter(id => cartes[id] && cartes[id].prochaine <= now)
            .sort((a, b) => cartes[a].prochaine - cartes[b].prochaine);
    }

    function nouvellesDuJour(ids, now = Date.now(), max = NOUVELLES_PAR_JOUR) {
        const d = load();
        const deja = d.nouvelles.jour === jourLocal(now) ? d.nouvelles.n : 0;
        const reste = Math.max(0, max - deja);
        return ids.filter(id => !d.cartes[id]).slice(0, reste);
    }

    function sessionDuJour(cartes, now = Date.now(), max = NOUVELLES_PAR_JOUR) {
        const parId = new Map(cartes.map(c => [c.id, c]));
        const tous = [...parId.keys()];
        return {
            dues: cartesDues(tous, now).map(id => parId.get(id)),
            nouvelles: nouvellesDuJour(tous, now, max).map(id => parId.get(id)),
        };
    }

    return { getCarte, noter, cartesDues, nouvellesDuJour, sessionDuJour };
}

export const cartesEtat = createCartes();

// Charge les cartes de toutes les séances marquées "cartes": true ; un fichier illisible est compté et ignoré.
export async function rassemblerCartes(index, charger) {
    const cartes = [];
    let erreurs = 0;
    for (const m of index.matieres || []) {
        for (const s of m.seances || []) {
            if (!s.cartes) continue;
            try {
                const f = await charger(s.dossier);
                if (!f || !Array.isArray(f.cartes)) throw new Error('cartes.json invalide');
                for (const c of f.cartes) cartes.push({ ...c, seanceId: s.id, seanceTitre: `${s.type} · ${s.titre}` });
            } catch { erreurs++; }
        }
    }
    return { cartes, erreurs };
}
