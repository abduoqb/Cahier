import { Store } from './store.js';
import { escapeHtml } from './utils.js?v=6';
import { chargerIndex, chargerQuiz, chargerTexte, messageErreur, slug } from './contenu.js';
import { construireSession } from './quiz-session.js';
import { lancerQuiz } from './quiz.js';

function md(texte, dossier) {
    return window.marked.parse(texte).replaceAll('src="img/', `src="contenu/${dossier}/img/`);
}

export async function renderSeance(matiereId, seanceId) {
    const app = document.getElementById('app');
    app.innerHTML = '<p class="seance-chargement">Chargement de la séance…</p>';
    try {
        const idx = await chargerIndex();
        const matiere = idx.matieres.find(m => m.id === matiereId);
        const seance = matiere && matiere.seances.find(s => s.id === seanceId);
        if (!seance) throw new Error('Séance introuvable.');
        const [cours, condense, quiz] = await Promise.all([
            chargerTexte(`${seance.dossier}/cours.md`),
            chargerTexte(`${seance.dossier}/condense.md`),
            chargerQuiz(seance.dossier),
        ]);
        const sujet = Store.getSubjects().find(s => slug(s.name) === matiereId);
        const retour = sujet ? `#/subject/${sujet.id}` : '#/';

        app.innerHTML = `
            <div class="seance">
                <a class="back-link" href="${retour}">← ${escapeHtml(matiere.nom)}</a>
                <h1 class="seance-titre">${escapeHtml(seance.type)} · ${escapeHtml(seance.titre)}</h1>
                <section class="seance-rappel" id="seance-rappel">
                    <p>Avant de lire : note trois choses que tu sais déjà sur ce sujet, sur papier ou dans ta tête.</p>
                    <button class="btn btn-primary" id="seance-ouvrir">J'ai noté, ouvrir la séance</button>
                </section>
                <div class="seance-corps" id="seance-corps" hidden>
                    <div class="seance-onglets" role="tablist">
                        <button class="seance-onglet is-actif" data-tab="cours">Cours</button>
                        <button class="seance-onglet" data-tab="condense">Condensé</button>
                        <button class="seance-onglet" data-tab="entrainement">S'entraîner</button>
                    </div>
                    <div class="seance-panneau" data-panneau="cours">
                        <details class="seance-pdf"><summary>Support du prof (PDF)</summary>
                            <iframe src="contenu/${seance.dossier}/support.pdf" title="Support du prof"></iframe></details>
                        <div class="seance-md">${md(cours, seance.dossier)}</div>
                    </div>
                    <div class="seance-panneau" data-panneau="condense" hidden><div class="seance-md">${md(condense, seance.dossier)}</div></div>
                    <div class="seance-panneau" data-panneau="entrainement" hidden><div id="seance-quiz"></div></div>
                </div>
            </div>`;

        app.querySelector('#seance-ouvrir').addEventListener('click', () => {
            app.querySelector('#seance-rappel').hidden = true;
            app.querySelector('#seance-corps').hidden = false;
        });
        const demarrerQuiz = () => {
            const questions = quiz.questions.map(q => ({ ...q, seanceId: seance.id }));
            lancerQuiz(app.querySelector('#seance-quiz'), construireSession(questions, { max: 10 }), { onRetour: demarrerQuiz });
        };
        app.querySelectorAll('.seance-onglet').forEach(btn => btn.addEventListener('click', () => {
            app.querySelectorAll('.seance-onglet').forEach(b => b.classList.toggle('is-actif', b === btn));
            app.querySelectorAll('.seance-panneau').forEach(p => { p.hidden = p.dataset.panneau !== btn.dataset.tab; });
            if (btn.dataset.tab === 'entrainement' && !app.querySelector('#seance-quiz').innerHTML.trim()) demarrerQuiz();
        }));
    } catch (e) {
        app.innerHTML = `<div class="seance"><a class="back-link" href="#/">← Accueil</a><p class="seance-erreur">${escapeHtml(messageErreur(e))}</p></div>`;
    }
}
