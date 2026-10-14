import { escapeHtml } from './utils.js?v=6';
import { chargerIndex, chargerQuiz, chargerCartes, messageErreur } from './contenu.js?v=2';
import { progress } from './progress.js';
import { choisirDuJour } from './quiz-session.js';
import { lancerQuiz } from './quiz.js';
import { cartesEtat, rassemblerCartes } from './cartes-etat.js';
import { lancerCartes } from './cartes.js';

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

function avertissement(n) {
    if (!n) return '';
    const s = n > 1 ? 's' : '';
    return `<p class="seance-erreur">${n} fichier${s} de contenu illisible${s}, ignoré${s}.</p>`;
}

// Un quiz.json illisible est ignoré : la session continue avec les autres.
async function quizzesDe() {
    const idx = await chargerIndex();
    const quizzes = {};
    let erreurs = 0;
    for (const m of idx.matieres) {
        for (const s of m.seances) {
            try { quizzes[s.id] = await chargerQuiz(s.dossier); } catch { erreurs++; }
        }
    }
    return { quizzes, erreurs };
}

async function cartesDuJour() {
    const idx = await chargerIndex();
    const { cartes, erreurs } = await rassemblerCartes(idx, chargerCartes);
    return { ...cartesEtat.sessionDuJour(cartes), total: cartes.length, erreurs };
}

// Carte d'accueil : notions à revoir (quiz) et cartes à revoir, un bouton pour chacun.
export async function renderTodayCard(element) {
    if (!element) return;
    try { await chargerIndex(); } catch { return; }
    const dues = progress.notionsDues();
    const texte = dues.length
        ? `${pluriel(dues.length, 'notion')} à revoir ou à consolider aujourd'hui.`
        : 'Rien à rattraper : on peut attaquer une séance ou s\'entraîner sur les annales.';
    let ligneCartes = '';
    let boutonCartes = '';
    try {
        const c = await cartesDuJour();
        const n = c.dues.length + c.nouvelles.length;
        if (c.total) {
            ligneCartes = n
                ? `${pluriel(n, 'carte')} à revoir${c.nouvelles.length ? ` (dont ${pluriel(c.nouvelles.length, 'nouvelle')})` : ''}.`
                : 'Aucune carte à revoir aujourd\'hui.';
            if (n) boutonCartes = '<a class="btn btn-secondary" href="#/cartes-du-jour">Cartes</a>';
        }
    } catch { /* cartes indisponibles : la carte d'accueil reste utilisable */ }
    element.innerHTML = `
        <section class="today-card">
            <div><h2 class="today-titre">Aujourd'hui</h2><p>${escapeHtml(texte)}</p>${ligneCartes ? `<p>${escapeHtml(ligneCartes)}</p>` : ''}</div>
            <div class="today-actions"><a class="btn btn-primary" href="#/aujourdhui">Quiz</a>${boutonCartes}</div>
        </section>`;
}

// Page de session : 8 questions maximum, notions dues d'abord, sinon annales.
export async function renderAujourdhui() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="seance"><a class="back-link" href="#/">← Accueil</a><h1 class="seance-titre">Aujourd\'hui</h1><div id="today-quiz"><p>Préparation…</p></div></div>';
    const zone = app.querySelector('#today-quiz');
    try {
        const dues = progress.notionsDues();
        const { quizzes, erreurs } = await quizzesDe();
        const { mode, questions } = choisirDuJour(dues, quizzes, { max: 8 });
        if (mode === 'vide') {
            zone.innerHTML = `${avertissement(erreurs)}<p class="quiz-vide">Rien à réviser pour l'instant. Ouvre une séance et lance un premier quiz.</p>`;
            return;
        }
        const intro = mode === 'revision' ? 'Notions à revoir.' : 'Rien à rattraper : entraînement sur des questions d\'annale.';
        zone.innerHTML = `${avertissement(erreurs)}<p class="today-intro">${intro}</p><div id="today-session"></div>`;
        lancerQuiz(zone.querySelector('#today-session'), questions, { onRetour: () => { window.location.hash = '#/'; } });
    } catch (e) {
        zone.innerHTML = `<p class="seance-erreur">${escapeHtml(messageErreur(e))}</p>`;
    }
}

// Session de cartes : dues d'abord (les plus en retard), puis les nouvelles du jour dans l'ordre des séances.
export async function renderCartesDuJour() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="seance"><a class="back-link" href="#/">← Accueil</a><h1 class="seance-titre">Cartes du jour</h1><div id="today-cartes"><p>Préparation…</p></div></div>';
    const zone = app.querySelector('#today-cartes');
    try {
        const { dues, nouvelles, erreurs } = await cartesDuJour();
        const serie = [...dues, ...nouvelles];
        if (!serie.length) {
            zone.innerHTML = `${avertissement(erreurs)}<p class="quiz-vide">Aucune carte à revoir aujourd'hui. Reviens demain.</p>`;
            return;
        }
        zone.innerHTML = `${avertissement(erreurs)}<p class="today-intro">${pluriel(dues.length, 'carte')} à revoir, ${pluriel(nouvelles.length, 'nouvelle')}.</p><div id="today-session"></div>`;
        lancerCartes(zone.querySelector('#today-session'), serie, {
            onNote: (c, ok) => cartesEtat.noter(c.id, ok),
            onFin: () => { window.location.hash = '#/'; },
        });
    } catch (e) {
        zone.innerHTML = `<p class="seance-erreur">${escapeHtml(messageErreur(e))}</p>`;
    }
}
