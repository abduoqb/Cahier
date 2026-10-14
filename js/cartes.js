import { escapeHtml } from './utils.js?v=6';

// Flashcards : recto, « Voir la réponse » (Espace), puis Je ne savais pas (1) / Je savais (2). Bilan en fin de série.
export function lancerCartes(conteneur, cartes, { onNote, onFin, libre = false } = {}) {
    if (conteneur._arreterCartes) conteneur._arreterCartes();
    const total = cartes.length;
    let i = 0;
    let sues = 0;
    let retournee = false;
    const ratees = [];

    if (total === 0) {
        conteneur.innerHTML = '<p class="quiz-vide">Aucune carte pour le moment.</p>';
        return;
    }

    // Raccourcis clavier, actifs seulement quand la série est affichée et visible.
    function touche(e) {
        if (!conteneur.isConnected) { arreter(); return; }
        if (conteneur.offsetParent === null || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
        if (e.key === ' ' && !retournee) { e.preventDefault(); retourner(); }
        else if (e.key === '1') noter(false);
        else if (e.key === '2') noter(true);
    }
    function arreter() {
        document.removeEventListener('keydown', touche);
        if (conteneur._arreterCartes === arreter) delete conteneur._arreterCartes;
    }
    document.addEventListener('keydown', touche);
    conteneur._arreterCartes = arreter;

    function afficher() {
        retournee = false;
        const c = cartes[i];
        conteneur.innerHTML = `
            <div class="carte">
                <div class="quiz-top"><span>Carte ${i + 1} sur ${total}</span>
                    <span class="quiz-bar"><i style="width:${(i / total) * 100}%"></i></span></div>
                ${c.seanceTitre ? `<p class="carte-seance">${escapeHtml(c.seanceTitre)}</p>` : ''}
                <p class="carte-recto">${escapeHtml(c.recto)}</p>
                <div class="carte-verso" hidden>
                    <p class="carte-reponse">${escapeHtml(c.verso)}</p>
                    <p class="quiz-source">Source : ${escapeHtml(c.source)}</p>
                </div>
                <div class="carte-actions">
                    <button class="btn btn-primary" data-action="retourner">Voir la réponse <kbd>Espace</kbd></button>
                    <button class="btn btn-secondary" data-action="non" hidden>Je ne savais pas <kbd>1</kbd></button>
                    <button class="btn btn-primary" data-action="oui" hidden>Je savais <kbd>2</kbd></button>
                </div>
            </div>`;
        conteneur.querySelector('[data-action="retourner"]').addEventListener('click', retourner);
        conteneur.querySelector('[data-action="non"]').addEventListener('click', () => noter(false));
        conteneur.querySelector('[data-action="oui"]').addEventListener('click', () => noter(true));
    }

    function retourner() {
        if (retournee || i >= total) return;
        retournee = true;
        conteneur.querySelector('.carte-verso').hidden = false;
        conteneur.querySelector('[data-action="retourner"]').hidden = true;
        conteneur.querySelectorAll('[data-action="non"], [data-action="oui"]').forEach(b => { b.hidden = false; });
    }

    function noter(ok) {
        if (!retournee || i >= total) return;
        const c = cartes[i];
        if (onNote) onNote(c, ok);
        if (ok) sues++; else ratees.push(c);
        i++;
        if (i < total) afficher(); else bilan();
    }

    function bilan() {
        arreter();
        conteneur.innerHTML = `
            <div class="carte quiz-bilan">
                <h3 class="quiz-enonce">${sues} sur ${total} sue${sues > 1 ? 's' : ''}</h3>
                <p>${ratees.length ? `${ratees.length} à revoir.` : 'Tout était su.'}</p>
                <div class="quiz-actions">
                    ${libre && ratees.length ? '<button class="btn btn-secondary" id="cartes-refaire">Refaire celles ratées</button>' : ''}
                    <button class="btn btn-primary" id="cartes-fin">Terminer</button>
                </div>
            </div>`;
        conteneur.querySelector('#cartes-fin').addEventListener('click', () => onFin && onFin());
        const refaire = conteneur.querySelector('#cartes-refaire');
        if (refaire) refaire.addEventListener('click', () => lancerCartes(conteneur, ratees, { onNote, onFin, libre }));
    }

    afficher();
}
