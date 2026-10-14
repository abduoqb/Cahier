// Progression par notion : acquise après 2 réussites espacées d'un jour, puis rappels à +3 j, +7 j, +30 j.
const DAY = 24 * 60 * 60 * 1000;
export const INTERVALLES = [3 * DAY, 7 * DAY, 30 * DAY];
const KEY = 'cahier.progress.v1';

function memoryStorage() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function defaultStorage() {
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* accès refusé */ }
    return memoryStorage();
}

export function createProgress(storage = defaultStorage(), key = KEY) {
    function valide(r) {
        if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
        const num = v => typeof v === 'number' && Number.isFinite(v);
        return num(r.n) && num(r.last)
            && (r.lastSuccess === null || num(r.lastSuccess))
            && (r.acquiseLe === null || num(r.acquiseLe))
            && Number.isInteger(r.palier) && r.palier >= 0 && r.palier < INTERVALLES.length
            && typeof r.revoir === 'boolean';
    }
    function load() {
        try {
            const d = JSON.parse(storage.getItem(key));
            if (!d || typeof d !== 'object' || !d.notions || typeof d.notions !== 'object') return { notions: {} };
            const notions = {};
            for (const [id, rec] of Object.entries(d.notions)) if (valide(rec)) notions[id] = rec;
            return { notions };
        } catch { return { notions: {} }; }
    }
    function save(d) {
        try { storage.setItem(key, JSON.stringify(d)); } catch { /* stockage plein ou refusé */ }
    }
    const cle = (seanceId, notion) => `${seanceId}/${notion}`;

    function etatDe(rec, now) {
        if (!rec) return 'pas-commencee';
        if (rec.acquiseLe) {
            if (rec.revoir) return 'a-revoir';
            return now >= rec.lastSuccess + INTERVALLES[rec.palier] ? 'a-revoir' : 'acquise';
        }
        return 'en-cours';
    }

    function getNotion(seanceId, notion, now = Date.now()) {
        const rec = load().notions[cle(seanceId, notion)];
        return { ...(rec || {}), etat: etatDe(rec, now) };
    }

    function recordAnswer(seanceId, question, ok, now = Date.now()) {
        const d = load();
        const id = cle(seanceId, question.notion);
        const rec = d.notions[id] || { n: 0, lastSuccess: null, last: now, acquiseLe: null, palier: 0, revoir: false };
        rec.last = now;
        if (ok) {
            if (rec.acquiseLe) {
                if (rec.revoir) { rec.revoir = false; rec.palier = 0; rec.lastSuccess = now; }
                else if (now >= rec.lastSuccess + INTERVALLES[rec.palier]) {
                    rec.palier = Math.min(rec.palier + 1, INTERVALLES.length - 1);
                    rec.lastSuccess = now;
                }
            } else if (rec.lastSuccess === null) { rec.n = 1; rec.lastSuccess = now; }
            else if (now - rec.lastSuccess >= DAY) { rec.n += 1; rec.lastSuccess = now; }
            if (!rec.acquiseLe && rec.n >= 2) { rec.acquiseLe = now; rec.palier = 0; }
        } else {
            rec.n = 0;
            rec.lastSuccess = null;
            if (rec.acquiseLe) rec.revoir = true;
        }
        d.notions[id] = rec;
        save(d);
    }

    function notionsDues(now = Date.now()) {
        const out = [];
        for (const [id, rec] of Object.entries(load().notions)) {
            const etat = etatDe(rec, now);
            if (etat !== 'a-revoir' && etat !== 'en-cours') continue;
            if (etat === 'en-cours' && rec.lastSuccess !== null && now - rec.lastSuccess < DAY) continue;
            const i = id.indexOf('/');
            out.push({ seanceId: id.slice(0, i), notion: id.slice(i + 1), etat, last: rec.last });
        }
        const rang = { 'a-revoir': 0, 'en-cours': 1 };
        return out.sort((a, b) => rang[a.etat] - rang[b.etat] || a.last - b.last);
    }

    function etatSeance(seanceId, notionsIds, now = Date.now()) {
        const d = load();
        const etats = notionsIds.map(n => etatDe(d.notions[cle(seanceId, n)], now));
        if (etats.every(e => e === 'pas-commencee')) return 'pas-commencee';
        if (etats.every(e => e === 'acquise')) return 'acquise';
        if (etats.includes('a-revoir')) return 'a-revoir';
        return 'en-cours';
    }

    return { getNotion, recordAnswer, notionsDues, etatSeance };
}

export const progress = createProgress();
