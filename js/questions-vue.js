// Interface des types de question : saisie (qcm, courte, trace, ordre, redaction) et correction détaillée.
// Partagée par le quiz (correction immédiate) et le partiel blanc (correction à la fin). Aucune logique de note ici : voir correction.js.
import { escapeHtml as e } from './utils.js?v=6';
import { monterPasAPas } from './pas-a-pas.js?v=5';
import { sansEspaces, normaliser } from './correction.js?v=1';

function el(balise, classe, texte) {
    const n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte !== undefined) n.textContent = texte;
    return n;
}

function lignesCode(code) {
    return `<pre class="qv-code" aria-label="Code">${code.map((l, i) => `<span class="qv-n">${i + 1}</span>${e(l) || ' '}`).join('\n')}</pre>`;
}

export function indicationSaisie(q) {
    switch (q.type || 'qcm') {
        case 'courte': return q.mode === 'commande' ? 'Tape la commande exacte (espaces et majuscules comptent).' : 'Réponds en quelques mots.';
        case 'trace': return 'Donne la valeur de chaque variable à la fin de l\'exécution.';
        case 'ordre': return 'Remets les éléments dans l\'ordre avec les flèches.';
        case 'redaction': return 'Rédige ta réponse. Tu te corrigeras ensuite avec le barème.';
        default: return '';
    }
}

// Affiche les champs de réponse. onChange reçoit la réponse complète à chaque modification.
export function monterSaisie(zone, q, rep, onChange, { onEntree } = {}) {
    zone.replaceChildren();
    const type = q.type || 'qcm';
    const aide = indicationSaisie(q);
    if (aide) zone.append(el('p', 'qv-aide', aide));

    if (type === 'qcm') {
        const bloc = el('div', 'quiz-choix');
        q.choix.forEach((c, k) => {
            const b = el('button', 'quiz-choix-btn', c);
            b.type = 'button';
            b.classList.toggle('is-choisie', rep === k);
            b.setAttribute('aria-pressed', String(rep === k));
            b.addEventListener('click', () => {
                bloc.querySelectorAll('button').forEach((x, i) => { x.classList.toggle('is-choisie', i === k); x.setAttribute('aria-pressed', String(i === k)); });
                onChange(k);
            });
            bloc.append(b);
        });
        zone.append(bloc);
    } else if (type === 'courte') {
        const inp = el('input', `quiz-input${q.mode === 'commande' ? ' is-code' : ''}`);
        inp.type = 'text';
        inp.value = typeof rep === 'string' ? rep : '';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        inp.setAttribute('autocapitalize', 'off');
        inp.setAttribute('aria-label', 'Ta réponse');
        inp.addEventListener('input', () => onChange(inp.value));
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter' && onEntree) { ev.preventDefault(); onEntree(); } });
        zone.append(inp);
    } else if (type === 'trace') {
        const courant = { ...(rep && typeof rep === 'object' ? rep : {}) };
        zone.insertAdjacentHTML('beforeend', lignesCode(q.code));
        const champs = el('div', 'qv-champs');
        for (const nom of Object.keys(q.attendu)) {
            const lab = el('label', 'qv-champ');
            lab.append(el('code', '', nom));
            const inp = el('input', 'quiz-input is-code');
            inp.type = 'text';
            inp.value = courant[nom] ?? '';
            inp.autocomplete = 'off';
            inp.spellcheck = false;
            inp.setAttribute('aria-label', `Valeur finale de ${nom}`);
            inp.addEventListener('input', () => { courant[nom] = inp.value; onChange({ ...courant }); });
            lab.append(inp);
            champs.append(lab);
        }
        zone.append(champs);
    } else if (type === 'ordre') {
        const ordre = Array.isArray(rep) ? [...rep] : [...(q.depart || q.elements)];
        const liste = el('ol', 'qv-ordre');
        const dessiner = focus => {
            liste.replaceChildren();
            ordre.forEach((txt, i) => {
                const li = el('li', 'qv-ordre-item');
                li.append(el('span', 'qv-ordre-texte', txt));
                const bouton = (symbole, nom, delta) => {
                    const b = el('button', 'btn btn-ghost btn-sm', symbole);
                    b.type = 'button';
                    b.setAttribute('aria-label', `${nom} : ${txt}`);
                    b.disabled = i + delta < 0 || i + delta >= ordre.length;
                    b.addEventListener('click', () => {
                        [ordre[i], ordre[i + delta]] = [ordre[i + delta], ordre[i]];
                        onChange([...ordre]);
                        dessiner(`${i + delta}:${delta}`);
                    });
                    return b;
                };
                li.append(bouton('↑', 'Monter', -1), bouton('↓', 'Descendre', 1));
                liste.append(li);
            });
            if (focus) {
                const [pos, delta] = focus.split(':').map(Number);
                liste.children[pos]?.querySelectorAll('button')[delta < 0 ? 0 : 1]?.focus();
            }
        };
        dessiner();
        zone.append(liste);
    } else if (type === 'redaction') {
        const t = el('textarea', 'quiz-texte');
        t.rows = 8;
        t.value = typeof rep === 'string' ? rep : '';
        t.setAttribute('aria-label', 'Ta réponse rédigée');
        t.addEventListener('input', () => onChange(t.value));
        zone.append(t);
    }
}

function markdown(texte) {
    return typeof window !== 'undefined' && window.marked ? window.marked.parse(texte) : `<p>${e(texte)}</p>`;
}

const pointsTexte = n => `${Math.round(n * 100) / 100} pt${n > 1 ? 's' : ''}`;

// Affiche la correction. Pour une rédaction, coches (booléens) et onCoches rendent le barème cochable ; sans onCoches il est en lecture seule.
export function monterCorrection(zone, q, rep, { coches = [], onCoches } = {}) {
    const type = q.type || 'qcm';
    let html = '';
    if (type === 'qcm') {
        html = `<div class="quiz-choix">${q.choix.map((c, k) => `<div class="quiz-choix-btn ${k === q.bonne ? 'is-bonne' : k === rep ? 'is-fausse' : ''}">${e(c)}</div>`).join('')}</div>`;
    } else if (type === 'courte') {
        const mode = q.mode === 'commande' ? 'commande' : 'texte';
        const juste = typeof rep === 'string' && q.reponses.some(a => normaliser(a, mode) === normaliser(rep, mode)) && normaliser(rep, mode) !== '';
        html = `<p class="qv-ligne">Ta réponse : <code class="${juste ? 'qv-ok' : 'qv-ko'}">${e(typeof rep === 'string' && rep.trim() ? rep : '(vide)')}</code></p>
            <p class="qv-ligne">Réponse${q.reponses.length > 1 ? 's acceptées' : ' attendue'} : ${q.reponses.map(a => `<code>${e(a)}</code>`).join(' · ')}</p>`;
    } else if (type === 'trace') {
        const r = rep && typeof rep === 'object' ? rep : {};
        html = `${lignesCode(q.code)}<table class="qv-table"><thead><tr><th>Variable</th><th>Ta valeur</th><th>Attendu</th></tr></thead><tbody>${
            Object.keys(q.attendu).map(n => {
                const juste = sansEspaces(r[n]) === sansEspaces(q.attendu[n]);
                return `<tr><td><code>${e(n)}</code></td><td class="${juste ? 'qv-ok' : 'qv-ko'}"><code>${e(r[n] ? r[n] : '(vide)')}</code></td><td><code>${e(q.attendu[n])}</code></td></tr>`;
            }).join('')}</tbody></table>${q.pasAPas ? '<div data-pap></div>' : ''}`;
    } else if (type === 'ordre') {
        const r = Array.isArray(rep) ? rep : [];
        html = `<p class="qv-label">Ordre attendu</p><ol class="qv-ordre">${q.elements.map((x, i) => `<li class="qv-ordre-item ${r[i] === x ? 'qv-ok' : 'qv-ko'}">${e(x)}</li>`).join('')}</ol>`;
    } else if (type === 'redaction') {
        const total = q.bareme.reduce((s, c) => s + c.points, 0);
        html = `<p class="qv-label">Ta réponse</p><pre class="qv-texte">${e(typeof rep === 'string' && rep.trim() ? rep : '(vide)')}</pre>
            <p class="qv-label">Corrigé</p><div class="seance-md qv-corrige">${markdown(q.corrige)}</div>
            <p class="qv-label">Barème${onCoches ? ' : coche ce que ta réponse contient' : ''}</p>
            <ul class="qv-bareme">${q.bareme.map((c, i) => `<li><label><input type="checkbox" data-i="${i}" ${coches[i] ? 'checked' : ''} ${onCoches ? '' : 'disabled'}> ${e(c.critere)} <b>(${pointsTexte(c.points)})</b></label></li>`).join('')}</ul>
            <p class="qv-total" data-total></p>`;
        zone.innerHTML = html;
        const etat = q.bareme.map((_, i) => coches[i] === true);
        const maj = () => { zone.querySelector('[data-total]').textContent = `${pointsTexte(q.bareme.reduce((s, c, i) => s + (etat[i] ? c.points : 0), 0))} sur ${pointsTexte(total)}`; };
        zone.querySelectorAll('input[data-i]').forEach(c => c.addEventListener('change', () => { etat[Number(c.dataset.i)] = c.checked; maj(); if (onCoches) onCoches([...etat]); }));
        maj();
        ajouterExplication(zone, q);
        return;
    }
    zone.innerHTML = html;
    const slot = zone.querySelector('[data-pap]');
    if (slot) slot.replaceWith(monterPasAPas({ ...q.pasAPas, titre: q.pasAPas.titre || 'Exécution pas à pas', code: q.code }));
    ajouterExplication(zone, q);
}

function ajouterExplication(zone, q) {
    zone.insertAdjacentHTML('beforeend', `<p class="qv-explication">${e(q.explication)}</p><p class="quiz-source">Source : ${e(q.source)}</p>`);
}
