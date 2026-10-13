import { escapeHtml } from './utils.js?v=6';
import { progress } from './progress.js';
import { preparerQuestion } from './quiz-session.js';

// Quiz QCM : une question à la fois, correction immédiate, bilan en fin de session.
export function lancerQuiz(conteneur, questions, { onRetour } = {}) {
    let i = 0;
    let bonnes = 0;
    const ratees = [];
    const total = questions.length;

    if (total === 0) {
        conteneur.innerHTML = '<p class="quiz-vide">Aucune question disponible pour le moment.</p>';
        return;
    }

    function afficher() {
        const q = questions[i];
        conteneur.innerHTML = `
            <div class="quiz">
                <div class="quiz-top"><span>Question ${i + 1} sur ${total}</span>
                    <span class="quiz-bar"><i style="width:${(i / total) * 100}%"></i></span></div>
                <h3 class="quiz-enonce">${escapeHtml(q.enonce)}</h3>
                <div class="quiz-choix">${q.choix.map((c, k) => `<button class="quiz-choix-btn" data-k="${k}">${escapeHtml(c)}</button>`).join('')}</div>
                <div class="quiz-retour" hidden></div>
            </div>`;
        conteneur.querySelectorAll('.quiz-choix-btn').forEach(b => b.addEventListener('click', () => repondre(Number(b.dataset.k))));
    }

    function repondre(k) {
        const q = questions[i];
        const ok = k === q.bonne;
        progress.recordAnswer(q.seanceId, q, ok);
        if (ok) bonnes++; else ratees.push(q);
        conteneur.querySelectorAll('.quiz-choix-btn').forEach((b, idx) => {
            b.disabled = true;
            if (idx === q.bonne) b.classList.add('is-bonne');
            else if (idx === k) b.classList.add('is-fausse');
        });
        const retour = conteneur.querySelector('.quiz-retour');
        retour.hidden = false;
        retour.innerHTML = `
            <p class="quiz-verdict ${ok ? 'ok' : 'ko'}">${ok ? 'Exact.' : 'Pas tout à fait.'}</p>
            <p>${escapeHtml(q.explication)}</p>
            <p class="quiz-source">Source : ${escapeHtml(q.source)}</p>
            <button class="btn btn-primary" id="quiz-suivante">${i + 1 < total ? 'Question suivante' : 'Voir le bilan'}</button>`;
        retour.querySelector('#quiz-suivante').addEventListener('click', () => { i++; i < total ? afficher() : bilan(); });
    }

    function bilan() {
        const notions = [...new Set(ratees.map(q => q.notion))];
        conteneur.innerHTML = `
            <div class="quiz quiz-bilan">
                <h3 class="quiz-enonce">${bonnes} sur ${total}</h3>
                ${notions.length ? `<p>À retravailler : ${notions.map(escapeHtml).join(', ')}</p>` : '<p>Aucune erreur sur cette série.</p>'}
                <div class="quiz-actions">
                    ${ratees.length ? '<button class="btn btn-secondary" id="quiz-refaire">Refaire les ratées</button>' : ''}
                    <button class="btn btn-primary" id="quiz-fin">Terminer</button>
                </div>
            </div>`;
        conteneur.querySelector('#quiz-fin').addEventListener('click', () => onRetour && onRetour());
        const refaire = conteneur.querySelector('#quiz-refaire');
        if (refaire) refaire.addEventListener('click', () => lancerQuiz(conteneur, ratees.map(q => preparerQuestion(q)), { onRetour }));
    }

    afficher();
}
