// Fonctions pures de la synchro (testables sans navigateur ni réseau).
// JSON canonique (clés triées) : deux objets identiques à l'ordre des clés près donnent la même chaîne.
export function canon(v) {
    if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
    if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
    return JSON.stringify(v) ?? 'null';
}

export const hash = e => canon([e.kind, e.parent, e.data]);

export function aplatir(donnees) {
    const m = new Map();
    (donnees.subjects || []).forEach((s, i) => {
        const { categories, exams, ...reste } = s;
        m.set(s.id, { kind: 'subject', parent: null, data: { ...reste, pos: i } });
        (exams || []).forEach((e, j) => {
            const { checklist, ...re } = e;
            m.set(e.id, { kind: 'exam', parent: s.id, data: { ...re, pos: j } });
            (checklist || []).forEach((c, k) => m.set(c.id, { kind: 'check', parent: e.id, data: { ...c, pos: k } }));
        });
        (categories || []).forEach((c, j) => {
            const cid = `${s.id}::${c.name}`;
            const { items, ...rc } = c;
            m.set(cid, { kind: 'cat', parent: s.id, data: { ...rc, pos: j } });
            (items || []).forEach((it, k) => m.set(it.id, { kind: 'item', parent: cid, data: { ...it, pos: k } }));
        });
    });
    return m;
}

export function reconstruire(fusion, ancien) {
    const vivant = [...fusion.entries()].filter(([, e]) => !e.d);
    const enfants = (parent, kind) => vivant.filter(([, e]) => e.parent === parent && e.kind === kind)
        .sort((a, b) => (a[1].data.pos ?? 0) - (b[1].data.pos ?? 0));
    const nu = e => { const { pos, ...d } = e.data; return d; };
    const subjects = enfants(null, 'subject').map(([sid, s]) => ({
        ...nu(s),
        exams: enfants(sid, 'exam').map(([eid, e]) => ({ ...nu(e), checklist: enfants(eid, 'check').map(([, c]) => nu(c)) })),
        categories: enfants(sid, 'cat').map(([cid, c]) => ({ ...nu(c), items: enfants(cid, 'item').map(([, it]) => nu(it)) })),
    }));
    return { ...ancien, subjects };
}

