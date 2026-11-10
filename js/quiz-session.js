// Fonctions pures pour construire une session de quiz.
export function melanger(tableau, rng = Math.random) {
    const a = [...tableau];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Mélange qui ne rend jamais l'ordre d'origine (sinon la question « ordre » serait déjà résolue).
export function melangerDifferent(tableau, rng = Math.random) {
    for (let k = 0; k < 10; k++) {
        const a = melanger(tableau, rng);
        if (a.some((x, i) => x !== tableau[i])) return a;
    }
    return [...tableau.slice(1), tableau[0]];
}

// qcm : mélange des choix. ordre : « depart » est l'ordre proposé (« elements » reste le bon ordre). Autres types : inchangés.
export function preparerQuestion(q, rng = Math.random) {
    if (q.type === 'ordre') return { ...q, depart: melangerDifferent(q.elements, rng) };
    if (!Array.isArray(q.choix)) return q;
    const ordre = melanger(q.choix.map((_, i) => i), rng);
    return { ...q, choix: ordre.map(i => q.choix[i]), bonne: ordre.indexOf(q.bonne) };
}

export function construireSession(questions, { max = 8, rng = Math.random } = {}) {
    return melanger(questions, rng).slice(0, max).map(q => preparerQuestion(q, rng));
}

function avecSeance(quizzes) {
    return Object.entries(quizzes).flatMap(([seanceId, quiz]) =>
        (quiz.questions || []).map(q => ({ ...q, seanceId })));
}

export function choisirDuJour(dues, quizzes, { max = 8, rng = Math.random } = {}) {
    const toutes = avecSeance(quizzes);
    const cles = new Set(dues.map(d => `${d.seanceId}/${d.notion}`));
    const revision = toutes.filter(q => cles.has(`${q.seanceId}/${q.notion}`));
    if (revision.length) return { mode: 'revision', questions: construireSession(revision, { max, rng }) };
    const annales = toutes.filter(q => /^annale/i.test(q.source || ''));
    if (annales.length) return { mode: 'annales', questions: construireSession(annales, { max, rng }) };
    return { mode: 'vide', questions: [] };
}
