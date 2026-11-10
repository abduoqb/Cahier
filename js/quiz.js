import { escapeHtml } from './utils.js?v=6';
import { progress } from './progress.js?v=2';
import { preparerQuestion } from './quiz-session.js?v=2';
import { corriger } from './correction.js?v=1';
import { monterSaisie, monterCorrection } from './questions-vue.js?v=1';

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
        if (q.type && q.type !== 'qcm') return afficherLibre(q);
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

    // courte, trace, ordre, redaction : on saisit, on valide, puis la correction s'affiche.
    function afficherLibre(q) {
        let rep;
        conteneur.innerHTML = `
            <div class="quiz">
                <div class="quiz-top"><span>Question ${i + 1} sur ${total}</span>
                    <span class="quiz-bar"><i style="width:${(i / total) * 100}%"></i></span></div>
                <h3 class="quiz-enonce">${escapeHtml(q.enonce)}</h3>
                <div class="quiz-saisie"></div>
                <div class="quiz-actions"><button class="btn btn-primary" id="quiz-valider">${q.type === 'redaction' ? 'Voir le corrigé' : 'Valider'}</button></div>
                <div class="quiz-retour" hidden></div>
            </div>`;
        const valider = () => {
            if (q.type === 'redaction') return corrigerRedaction(q, typeof rep === 'string' ? rep : '');
            terminer(q, rep, corriger(q, rep));
        };
        monterSaisie(conteneur.querySelector('.quiz-saisie'), q, rep, r => { rep = r; }, { onEntree: valider });
        conteneur.querySelector('#quiz-valider').addEventListener('click', valider);
    }

    // Rédaction : le corrigé et le barème s'affichent, l'élève coche ce qu'il a obtenu (une correction IA pourra pré-cocher plus tard).
    function corrigerRedaction(q, texte) {
        conteneur.querySelector('.quiz-saisie').hidden = true;
        conteneur.querySelector('.quiz-actions').hidden = true;
        const retour = conteneur.querySelector('.quiz-retour');
        retour.hidden = false;
        retour.innerHTML = '<div class="qv-correction"></div><button class="btn btn-primary" id="quiz-autoeval">Enregistrer mon auto-évaluation</button>';
        let coches = q.bareme.map(() => false);
        monterCorrection(retour.querySelector('.qv-correction'), q, texte, { coches, onCoches: c => { coches = c; } });
        retour.querySelector('#quiz-autoeval').addEventListener('click', () => terminer(q, coches, corriger(q, coches), texte));
    }

    function terminer(q, rep, { score, ok }, affichee = rep) {
        progress.recordAnswer(q.seanceId, q, ok);
        if (ok) bonnes++; else ratees.push(q);
        conteneur.querySelector('.quiz-saisie').hidden = true;
        conteneur.querySelector('.quiz-actions').hidden = true;
        const retour = conteneur.querySelector('.quiz-retour');
        retour.hidden = false;
        const verdict = score === 1 ? ['ok', 'Exact.'] : ok ? ['ok', `En partie : ${Math.round(score * 100)} %.`] : ['ko', 'Pas tout à fait.'];
        retour.innerHTML = `<p class="quiz-verdict ${verdict[0]}">${verdict[1]}</p><div class="qv-correction"></div>
            <button class="btn btn-primary" id="quiz-suivante">${i + 1 < total ? 'Question suivante' : 'Voir le bilan'}</button>`;
        monterCorrection(retour.querySelector('.qv-correction'), q, affichee, { coches: q.type === 'redaction' ? rep : [] });
        retour.querySelector('#quiz-suivante').addEventListener('click', () => { i++; i < total ? afficher() : bilan(); });
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
