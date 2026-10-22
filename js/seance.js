import { Store } from './store.js';
import { escapeHtml } from './utils.js?v=6';
import { chargerIndex, chargerQuiz, chargerTexte, chargerCartes, existe, messageErreur, slug } from './contenu.js?v=3';
import { construireSession, melanger } from './quiz-session.js';
import { lancerQuiz } from './quiz.js';
import { lancerCartes } from './cartes.js';

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
        const [cours, condense, quiz, cartes] = await Promise.all([
            chargerTexte(`${seance.dossier}/cours.md`),
            chargerTexte(`${seance.dossier}/condense.md`),
            chargerQuiz(seance.dossier),
            seance.cartes ? chargerCartes(seance.dossier).catch(() => null) : Promise.resolve(null),
        ]);
        const [aSupport, aFiche] = await Promise.all([
            existe(`${seance.dossier}/support.pdf`), existe(`${seance.dossier}/fiche.pdf`),
        ]);
        const pdfs = [
            aSupport && ['Support du prof (PDF)', 'support.pdf', 'Support du prof'],
            aFiche && ['Fiche de révision (PDF)', 'fiche.pdf', 'Fiche de révision'],
        ].filter(Boolean).map(([titre, fichier, t]) => `<details class="seance-pdf"><summary>${titre}</summary>
                            <iframe src="contenu/${seance.dossier}/${fichier}" title="${t}"></iframe></details>`).join('');
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
                        ${seance.cartes ? '<button class="seance-onglet" data-tab="cartes">Cartes</button>' : ''}
                    </div>
                    <div class="seance-panneau" data-panneau="cours">
                        ${pdfs}
                        <div class="seance-md">${md(cours, seance.dossier)}</div>
                    </div>
                    <div class="seance-panneau" data-panneau="condense" hidden><div class="seance-md">${md(condense, seance.dossier)}</div></div>
                    <div class="seance-panneau" data-panneau="entrainement" hidden><div id="seance-quiz"></div></div>
                    ${seance.cartes ? `<div class="seance-panneau" data-panneau="cartes" hidden>
                        <p class="today-intro">Révision libre : ton calendrier de cartes n'est pas modifié.</p>
                        <div id="seance-cartes"></div></div>` : ''}
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
        const demarrerCartes = () => {
            const zone = app.querySelector('#seance-cartes');
            if (!cartes || !Array.isArray(cartes.cartes)) {
                zone.innerHTML = '<p class="seance-erreur">Les cartes de cette séance sont illisibles pour le moment.</p>';
                return;
            }
            lancerCartes(zone, melanger(cartes.cartes), { libre: true, onFin: demarrerCartes });
        };
        app.querySelectorAll('.seance-onglet').forEach(btn => btn.addEventListener('click', () => {
            app.querySelectorAll('.seance-onglet').forEach(b => b.classList.toggle('is-actif', b === btn));
            app.querySelectorAll('.seance-panneau').forEach(p => { p.hidden = p.dataset.panneau !== btn.dataset.tab; });
            if (btn.dataset.tab === 'entrainement' && !app.querySelector('#seance-quiz').innerHTML.trim()) demarrerQuiz();
            if (btn.dataset.tab === 'cartes' && !app.querySelector('#seance-cartes').innerHTML.trim()) demarrerCartes();
        }));
    } catch (e) {
        app.innerHTML = `<div class="seance"><a class="back-link" href="#/">← Accueil</a><p class="seance-erreur">${escapeHtml(messageErreur(e))}</p></div>`;
    }
}
