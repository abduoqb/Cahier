import { escapeHtml } from './utils.js?v=6';
import { trouverMatiere } from './contenu.js';
import { progress } from './progress.js';

const LIBELLES = { 'pas-commencee': 'Pas commencée', 'en-cours': 'En cours', 'acquise': 'Acquise', 'a-revoir': 'À revoir' };

// Affiche les séances du contenu/ qui correspondent à la matière ; rien si aucune.
export async function renderSeancesSection(sujet, element) {
    if (!element) return;
    let matiere = null;
    try { matiere = await trouverMatiere(sujet.name); } catch { return; }
    if (!matiere || !matiere.seances.length) return;
    element.innerHTML = `
        <h2 class="seances-titre">Séances</h2>
        <ul class="seances-liste">${matiere.seances.map(s => {
            const etat = progress.etatSeance(s.id, s.notions || []);
            return `<li><a class="seance-ligne" href="#/seance/${encodeURIComponent(matiere.id)}/${encodeURIComponent(s.id)}">
                <span class="seance-type">${escapeHtml(s.type)}</span>
                <span class="seance-nom">${escapeHtml(s.titre)}</span>
                <span class="seance-etat etat-${etat}">${LIBELLES[etat]}</span></a></li>`;
        }).join('')}</ul>`;
}
