// Écrans du partiel blanc (#/partiel/<matière>) : accueil, épreuve chronométrée, auto-évaluation des rédactions, résultat.
// La logique (note, chrono, fusion) est dans partiel.js et correction.js ; ici seulement l'affichage.
import { Store } from './store.js';
import { escapeHtml as e, uuid } from './utils.js?v=6';
import { chargerIndex, chargerPartiel, messageErreur, slug } from './contenu.js?v=4';
import { partiels, construireSujet, sujetsDe, tempsRestant, formatDuree, noterPartiel, notionsRatees, creerEnregistrement } from './partiel.js?v=1';
import { progress } from './progress.js?v=2';
import { pointsQuestion, correcteurManuel } from './correction.js?v=1';
import { monterSaisie, monterCorrection } from './questions-vue.js?v=1';

let minuteur = null;
const arreter = () => { clearInterval(minuteur); minuteur = null; };

const nombre = n => String(Math.round(n * 100) / 100).replace('.', ',');
const dateFr = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function estRepondue(q, rep) {
    switch (q.type || 'qcm') {
        case 'qcm': return Number.isInteger(rep);
        case 'courte': case 'redaction': return typeof rep === 'string' && rep.trim() !== '';
        case 'trace': return !!rep && Object.values(rep).some(v => String(v).trim() !== '');
        case 'ordre': return Array.isArray(rep);
        default: return false;
    }
}

// Les rédactions sont notées par les critères cochés ; les autres types par leur réponse.
const reponsesNotables = etat => Object.fromEntries(etat.questions.map(q => [q.id, q.type === 'redaction' ? (etat.coches[q.id] || []) : etat.reponses[q.id]]));

function tableauNotions(parNotion) {
    const ratees = new Set(notionsRatees(parNotion).map(n => `${n.seanceId}/${n.notion}`));
    const lignes = Object.entries(parNotion).map(([cle, n]) => {
        const pct = n.max ? Math.round((n.points / n.max) * 100) : 0;
        return `<tr><td>${e(cle.slice(cle.indexOf('/') + 1))}</td><td>${nombre(n.points)} / ${nombre(n.max)}</td>
            <td><span class="partiel-barre"><i style="width:${pct}%"></i></span> ${pct} %</td>
            <td>${ratees.has(cle) ? '<span class="seance-etat etat-a-revoir">À revoir</span>' : ''}</td></tr>`;
    });
    return `<table class="qv-table partiel-notions"><thead><tr><th>Notion</th><th>Points</th><th>Réussite</th><th></th></tr></thead><tbody>${lignes.join('')}</tbody></table>`;
}

export async function renderPartiel(matiereId, { correcteur = correcteurManuel } = {}) {
    arreter();
    const app = document.getElementById('app');
    app.innerHTML = '<p class="seance-chargement">Chargement du partiel…</p>';
    const hashDepart = location.hash;
    try {
        const idx = await chargerIndex();
        const matiere = idx.matieres.find(m => m.id === matiereId);
        if (!matiere || !matiere.partielBlanc) throw new Error('Aucun partiel blanc pour cette matière.');
        const fichier = await chargerPartiel(matiere.id);
        if (location.hash !== hashDepart) return;
        const sujet = Store.getSubjects().find(s => slug(s.name) === matiereId);
        const ctx = { app, matiere, fichier, retour: sujet ? `#/subject/${sujet.id}` : '#/', correcteur };
        const b = partiels.brouillon();
        reprendreOuAccueil(ctx, b && b.matiere === matiereId ? b : null);
    } catch (err) {
        app.innerHTML = `<div class="seance"><a class="back-link" href="#/">← Accueil</a><p class="seance-erreur">${e(messageErreur(err))}</p></div>`;
    }
}

function reprendreOuAccueil(ctx, brouillon) {
    if (brouillon && brouillon.fin) return autoEvaluation(ctx, brouillon); // copie déjà rendue, pas encore notée
    accueil(ctx, brouillon);
}

// ===== Accueil =====

function accueil(ctx, brouillon) {
    const { app, matiere, fichier, retour } = ctx;
    const sujets = sujetsDe(fichier.questions);
    const historique = partiels.lister(matiere.id);
    const restant = brouillon ? tempsRestant(brouillon.debut, brouillon.duree) : 0;
    app.innerHTML = `
        <div class="seance partiel">
            <a class="back-link" href="${retour}">← ${e(matiere.nom)}</a>
            <h1 class="seance-titre">Partiel blanc · ${e(matiere.nom)}</h1>
            ${brouillon ? `<section class="partiel-reprise"><p>Un partiel est en cours (${restant > 0 ? `il reste ${formatDuree(restant)}` : 'le temps est écoulé'}).</p>
                <button class="btn btn-primary" id="p-reprendre">${restant > 0 ? 'Reprendre' : 'Rendre la copie'}</button>
                <button class="btn btn-ghost" id="p-abandon">Abandonner</button></section>` : ''}
            <section class="partiel-reglages">
                <p>Conditions réelles : chronomètre, aucune correction avant la fin, navigation libre. La note est sur 20.</p>
                ${sujets.length ? `<label class="partiel-champ">Sujet
                    <select id="p-sujet">${sujets.map(s => `<option value="${e(s)}">${e(s)}</option>`).join('')}<option value="">Tous mélangés</option></select></label>` : ''}
                <label class="partiel-champ">Durée (minutes)
                    <input type="number" id="p-duree" min="10" max="360" step="5" value="${fichier.duree}"></label>
                <button class="btn btn-primary" id="p-demarrer">Commencer le partiel</button>
            </section>
            <section class="partiel-historique">
                <h2 class="seances-titre">Historique</h2>
                ${historique.length ? `<ul class="partiel-liste">${historique.map(r => `<li data-id="${e(r.id)}">
                    <span>${dateFr(r.date)}${r.detail && r.detail.sujet ? ` · ${e(r.detail.sujet)}` : ''}</span>
                    <strong>${nombre(r.note)} / 20</strong><span>${formatDuree(r.duree_s)}</span>
                    <button class="btn btn-ghost btn-sm" data-detail>Détail par notion</button>
                    <button class="btn btn-ghost btn-sm" data-suppr>Supprimer</button>
                    <div class="partiel-detail" hidden>${r.detail && r.detail.parNotion ? tableauNotions(r.detail.parNotion) : ''}</div></li>`).join('')}</ul>`
                    : '<p class="quiz-vide">Aucun partiel passé pour le moment.</p>'}
            </section>
        </div>`;

    const reprendre = app.querySelector('#p-reprendre');
    if (reprendre) reprendre.addEventListener('click', () => epreuve(ctx, brouillon));
    const abandon = app.querySelector('#p-abandon');
    if (abandon) abandon.addEventListener('click', () => { if (confirm('Abandonner ce partiel ? Les réponses seront perdues.')) { partiels.effacerBrouillon(); accueil(ctx, null); } });
    app.querySelector('#p-demarrer').addEventListener('click', () => {
        if (brouillon && !confirm('Un partiel est déjà en cours. Le remplacer ?')) return;
        const select = app.querySelector('#p-sujet');
        const duree = Math.max(10, Math.min(360, Math.round(Number(app.querySelector('#p-duree').value)) || fichier.duree));
        const questions = construireSujet(fichier.questions, { sujet: select ? select.value || null : null });
        epreuve(ctx, { id: uuid(), matiere: matiere.id, sujet: select ? select.value || null : null, debut: Date.now(), duree, questions, reponses: {}, coches: {}, courante: 0, fin: null });
    });
    app.querySelectorAll('.partiel-liste li').forEach(li => {
        li.querySelector('[data-detail]').addEventListener('click', () => { const d = li.querySelector('.partiel-detail'); d.hidden = !d.hidden; });
        li.querySelector('[data-suppr]').addEventListener('click', () => { if (confirm('Supprimer ce partiel de l\'historique ?')) { partiels.supprimer(li.dataset.id); accueil(ctx, brouillon); } });
    });
}

// ===== Épreuve =====

function epreuve(ctx, etat) {
    const { app, matiere } = ctx;
    const sauver = () => partiels.sauverBrouillon(etat);
    sauver();
    app.innerHTML = `
        <div class="seance partiel partiel-epreuve">
            <header class="partiel-entete">
                <span class="partiel-titre">${e(matiere.nom)}${etat.sujet ? ` · ${e(etat.sujet)}` : ''}</span>
                <span class="partiel-chrono" id="p-chrono" role="timer" aria-label="Temps restant"></span>
                <button class="btn btn-primary btn-sm" id="p-rendre">Rendre la copie</button>
            </header>
            <nav class="partiel-nav" aria-label="Questions"></nav>
            <section class="quiz partiel-question"></section>
        </div>`;
    const nav = app.querySelector('.partiel-nav');
    const zone = app.querySelector('.partiel-question');
    const chrono = app.querySelector('#p-chrono');
    const n = etat.questions.length;

    function majNav() {
        nav.replaceChildren(...etat.questions.map((q, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = i + 1;
            b.className = `partiel-pastille${estRepondue(q, etat.reponses[q.id]) ? ' is-repondue' : ''}${i === etat.courante ? ' is-courante' : ''}`;
            b.setAttribute('aria-label', `Question ${i + 1}${estRepondue(q, etat.reponses[q.id]) ? ', répondue' : ''}`);
            b.addEventListener('click', () => { etat.courante = i; afficher(); });
            return b;
        }));
    }
    function afficher() {
        const q = etat.questions[etat.courante];
        const i = etat.courante;
        zone.innerHTML = `
            <div class="quiz-top"><span>Question ${i + 1} sur ${n}</span><span class="partiel-points">${nombre(pointsQuestion(q))} pt${pointsQuestion(q) > 1 ? 's' : ''}</span></div>
            <h3 class="quiz-enonce">${e(q.enonce)}</h3>
            <div class="quiz-saisie"></div>
            <div class="quiz-actions">
                <button class="btn btn-secondary" id="p-prec" ${i === 0 ? 'disabled' : ''}>Précédente</button>
                <button class="btn btn-secondary" id="p-suiv" ${i === n - 1 ? 'disabled' : ''}>Suivante</button>
            </div>`;
        monterSaisie(zone.querySelector('.quiz-saisie'), q, etat.reponses[q.id], r => {
            etat.reponses[q.id] = r;
            sauver();
            majNav();
        });
        zone.querySelector('#p-prec').addEventListener('click', () => { etat.courante--; sauver(); afficher(); });
        zone.querySelector('#p-suiv').addEventListener('click', () => { etat.courante++; sauver(); afficher(); });
        majNav();
    }
    function rendre(auto) {
        if (!auto) {
            const vides = etat.questions.filter(q => !estRepondue(q, etat.reponses[q.id])).length;
            if (!confirm(vides ? `Il reste ${vides} question${vides > 1 ? 's' : ''} sans réponse. Rendre la copie ?` : 'Rendre la copie ?')) return;
        }
        arreter();
        etat.fin = Math.min(Date.now(), etat.debut + etat.duree * 60000);
        sauver();
        autoEvaluation(ctx, etat);
    }
    function tic() {
        const r = tempsRestant(etat.debut, etat.duree);
        chrono.textContent = formatDuree(r);
        chrono.classList.toggle('is-urgent', r <= 300);
        if (r <= 0) { alert('Temps écoulé : la copie est rendue.'); rendre(true); }
    }
    app.querySelector('#p-rendre').addEventListener('click', () => rendre(false));
    afficher();
    arreter();
    minuteur = setInterval(() => {
        if (!location.hash.startsWith('#/partiel/')) return arreter(); // l'utilisateur a quitté la page : le brouillon reste, le temps court
        tic();
    }, 1000);
    tic();
}

// ===== Auto-évaluation des rédactions =====

async function autoEvaluation(ctx, etat) {
    const { app } = ctx;
    const redactions = etat.questions.filter(q => q.type === 'redaction' && estRepondue(q, etat.reponses[q.id]));
    if (!redactions.length) return resultat(ctx, etat);
    app.innerHTML = '<p class="seance-chargement">Préparation de la correction…</p>';
    for (const q of redactions) {
        if (etat.coches[q.id]) continue;
        try { etat.coches[q.id] = (await ctx.correcteur(q, etat.reponses[q.id])).coches; }
        catch { etat.coches[q.id] = q.bareme.map(() => false); } // correcteur IA indisponible : on retombe sur l'auto-évaluation
    }
    partiels.sauverBrouillon(etat);
    app.innerHTML = `
        <div class="seance partiel">
            <h1 class="seance-titre">Corrige tes rédactions</h1>
            <p class="today-intro">Compare ta réponse au corrigé et coche les points du barème que tu as obtenus. Les rédactions sans réponse comptent 0.</p>
            ${redactions.map(q => `<section class="quiz partiel-autoeval" data-id="${e(q.id)}"><h3 class="quiz-enonce">Question ${etat.questions.indexOf(q) + 1} · ${e(q.enonce)}</h3><div class="qv-correction"></div></section>`).join('')}
            <button class="btn btn-primary" id="p-note">Voir ma note</button>
        </div>`;
    for (const q of redactions) {
        const z = app.querySelector(`[data-id="${CSS.escape(q.id)}"] .qv-correction`);
        monterCorrection(z, q, etat.reponses[q.id], { coches: etat.coches[q.id], onCoches: c => { etat.coches[q.id] = c; partiels.sauverBrouillon(etat); } });
    }
    app.querySelector('#p-note').addEventListener('click', () => resultat(ctx, etat));
}

// ===== Résultat =====

function resultat(ctx, etat) {
    const { app, matiere, retour } = ctx;
    const res = noterPartiel(etat.questions, reponsesNotables(etat));
    const dureeS = (etat.fin - etat.debut) / 1000;
    partiels.ajouter(creerEnregistrement({ id: etat.id, matiere: matiere.id, sujet: etat.sujet, date: etat.debut, dureeS, resultat: res }));
    for (const n of notionsRatees(res.parNotion)) progress.marquerARevoir(n.seanceId, n.notion);
    partiels.effacerBrouillon();

    app.innerHTML = `
        <div class="seance partiel">
            <a class="back-link" href="${retour}">← ${e(matiere.nom)}</a>
            <h1 class="seance-titre">Résultat · ${e(matiere.nom)}</h1>
            <section class="partiel-note"><strong>${nombre(res.note20)}</strong><span>/ 20</span>
                <p>${nombre(res.points)} point${res.points > 1 ? 's' : ''} sur ${nombre(res.max)} · ${formatDuree(dureeS)} sur ${formatDuree(etat.duree * 60)}</p></section>
            <h2 class="seances-titre">Par notion</h2>
            ${tableauNotions(res.parNotion)}
            <p class="today-intro">Les notions sous 50 % sont passées « à revoir » : elles reviennent dans « Aujourd'hui ».</p>
            <h2 class="seances-titre">Par question</h2>
            <div class="partiel-corrections">${etat.questions.map((q, i) => {
                const p = res.parQuestion[i];
                return `<details class="partiel-correction" data-i="${i}"><summary><span class="partiel-n">${i + 1}</span> ${e(q.notion)}
                    <b class="${p.score >= 0.5 ? 'qv-ok' : 'qv-ko'}">${nombre(p.points)} / ${nombre(p.max)}</b></summary>
                    <h3 class="quiz-enonce">${e(q.enonce)}</h3><div class="qv-correction"></div></details>`;
            }).join('')}</div>
            <div class="quiz-actions"><a class="btn btn-secondary" href="${retour}">Retour à la matière</a>
                <button class="btn btn-primary" id="p-nouveau">Nouveau partiel</button></div>
        </div>`;
    const notables = reponsesNotables(etat);
    app.querySelectorAll('.partiel-correction').forEach(d => {
        const q = etat.questions[Number(d.dataset.i)];
        d.addEventListener('toggle', () => {
            if (!d.open || d.dataset.pret) return;
            d.dataset.pret = '1';
            const rep = q.type === 'redaction' ? etat.reponses[q.id] : notables[q.id];
            monterCorrection(d.querySelector('.qv-correction'), q, rep, { coches: q.type === 'redaction' ? (etat.coches[q.id] || []) : [] });
        });
    });
    app.querySelector('#p-nouveau').addEventListener('click', () => accueil(ctx, null));
}
