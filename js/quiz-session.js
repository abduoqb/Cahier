// Fonctions pures pour construire une session de quiz.
export function melanger(tableau, rng = Math.random) {
    const a = [...tableau];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function preparerQuestion(q, rng = Math.random) {
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
