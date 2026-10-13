import { escapeHtml } from './utils.js?v=6';
import { chargerIndex, chargerQuiz, messageErreur } from './contenu.js';
import { progress } from './progress.js';
import { choisirDuJour } from './quiz-session.js';
import { lancerQuiz } from './quiz.js';

async function quizzesDe(seancesIds) {
    const idx = await chargerIndex();
    const quizzes = {};
    for (const m of idx.matieres) {
        for (const s of m.seances) {
            if (seancesIds && !seancesIds.has(s.id)) continue;
            quizzes[s.id] = await chargerQuiz(s.dossier);
        }
    }
    return quizzes;
}

// Carte d'accueil : combien de notions à revoir, bouton Commencer.
export async function renderTodayCard(element) {
    if (!element) return;
    try { await chargerIndex(); } catch { return; }
    const dues = progress.notionsDues();
    const texte = dues.length
        ? `${dues.length} notion${dues.length > 1 ? 's' : ''} à revoir aujourd'hui.`
        : 'Rien à rattraper : on peut attaquer une séance ou s\'entraîner sur les annales.';
    element.innerHTML = `
        <section class="today-card">
            <div><h2 class="today-titre">Aujourd'hui</h2><p>${escapeHtml(texte)}</p></div>
            <a class="btn btn-primary" href="#/aujourdhui">Commencer</a>
        </section>`;
}

// Page de session : 8 questions maximum, notions dues d'abord, sinon annales.
export async function renderAujourdhui() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="seance"><a class="back-link" href="#/">← Accueil</a><h1 class="seance-titre">Aujourd\'hui</h1><div id="today-quiz"><p>Préparation…</p></div></div>';
    const zone = app.querySelector('#today-quiz');
    try {
        const dues = progress.notionsDues();
        const quizzes = await quizzesDe(null);
        const { mode, questions } = choisirDuJour(dues, quizzes, { max: 8 });
        if (mode === 'vide') {
            zone.innerHTML = '<p class="quiz-vide">Rien à réviser pour l\'instant. Ouvre une séance et lance un premier quiz.</p>';
            return;
        }
        const intro = mode === 'revision' ? 'Notions à revoir.' : 'Rien à rattraper : entraînement sur des questions d\'annale.';
        zone.innerHTML = `<p class="today-intro">${intro}</p><div id="today-session"></div>`;
        lancerQuiz(zone.querySelector('#today-session'), questions, { onRetour: () => { window.location.hash = '#/'; } });
    } catch (e) {
        zone.innerHTML = `<p class="seance-erreur">${escapeHtml(messageErreur(e))}</p>`;
    }
}
