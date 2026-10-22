// Composant « pas à pas » : un bloc de code « pas-a-pas » (JSON) dans un cours devient un exécuteur d'algorithme.
// Le code du cours s'affiche avec la ligne courante en surbrillance, les variables à jour et un schéma
// (liste chaînée ou tableau). L'auteur n'écrit que des données ; validerPasAPas les contrôle (aussi appelé par tools/check_contenu.js).

const MAX_ETAPES = 60;
const MAX_LIGNES = 30;
const MAX_NOTE = 240;

const estEntier = v => Number.isInteger(v);
const estTexte = v => typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v));
const estObjet = v => !!v && typeof v === 'object' && !Array.isArray(v);

// Renvoie la liste des erreurs de la définition (vide si elle est valide).
export function validerPasAPas(def) {
    const e = [];
    if (!estObjet(def)) return ['le bloc doit être un objet JSON'];
    if (def.titre !== undefined && typeof def.titre !== 'string') e.push('titre : texte attendu');
    if (!Array.isArray(def.code) || def.code.length === 0 || def.code.length > MAX_LIGNES || def.code.some(l => typeof l !== 'string')) {
        e.push(`code : tableau de 1 à ${MAX_LIGNES} lignes de texte`);
    }
    if (!Array.isArray(def.etapes) || def.etapes.length === 0 || def.etapes.length > MAX_ETAPES) {
        e.push(`etapes : tableau de 1 à ${MAX_ETAPES} étapes`);
        return e;
    }
    const nLignes = Array.isArray(def.code) ? def.code.length : 0;
    def.etapes.forEach((et, i) => {
        const ou = `étape ${i + 1}`;
        if (!estObjet(et)) { e.push(`${ou} : objet attendu`); return; }
        if (et.ligne !== null && et.ligne !== undefined && !(estEntier(et.ligne) && et.ligne >= 0 && et.ligne < nLignes)) {
            e.push(`${ou} : ligne hors du code (0 à ${nLignes - 1}, ou null)`);
        }
        if (et.note !== undefined && (typeof et.note !== 'string' || et.note.length > MAX_NOTE)) e.push(`${ou} : note en texte de ${MAX_NOTE} caractères maximum`);
        if (et.vars !== undefined && (!estObjet(et.vars) || Object.values(et.vars).some(v => !estTexte(v)))) e.push(`${ou} : vars doit associer un nom à un texte ou un nombre`);
        if (et.schema !== undefined) e.push(...validerSchema(et.schema).map(m => `${ou} : ${m}`));
    });
    return e;
}

function validerSchema(s) {
    if (!estObjet(s)) return ['schema : objet attendu'];
    const e = [];
    const dansBornes = (n, max) => estEntier(n) && n >= 0 && n < max;
    if (s.type === 'liste') {
        if (!Array.isArray(s.noeuds) || s.noeuds.length === 0 || s.noeuds.length > 12) return ['schema liste : 1 à 12 noeuds'];
        const n = s.noeuds.length;
        s.noeuds.forEach((nd, i) => {
            if (!estObjet(nd) || !estTexte(nd.v)) e.push(`noeud ${i} : "v" (valeur) attendue`);
            else if (nd.suivant !== null && nd.suivant !== undefined && (!dansBornes(nd.suivant, n) || nd.suivant === i)) e.push(`noeud ${i} : "suivant" doit être null ou l'indice d'un autre noeud`);
        });
        for (const [nom, cible] of Object.entries(s.pointeurs || {})) {
            if (cible !== null && !dansBornes(cible, n)) e.push(`pointeur ${nom} : null ou indice de noeud attendu`);
        }
    } else if (s.type === 'tableau') {
        if (!Array.isArray(s.cases) || s.cases.length === 0 || s.cases.length > 16 || s.cases.some(c => !estTexte(c))) return ['schema tableau : 1 à 16 cases (texte ou nombre)'];
        const n = s.cases.length;
        for (const [nom, cible] of Object.entries(s.marques || {})) if (!dansBornes(cible, n)) e.push(`marque ${nom} : indice de case attendu`);
        for (const cle of ['surligne', 'fixes']) {
            if (s[cle] !== undefined && (!Array.isArray(s[cle]) || s[cle].some(k => !dansBornes(k, n)))) e.push(`${cle} : liste d'indices de cases attendue`);
        }
    } else if (s.type === 'arbre') {
        if (!Array.isArray(s.noeuds) || s.noeuds.length === 0 || s.noeuds.length > 15) return ['schema arbre : 1 à 15 noeuds'];
        const n = s.noeuds.length;
        const racine = s.racine ?? 0;
        if (!dansBornes(racine, n)) e.push('racine : indice de noeud attendu');
        s.noeuds.forEach((nd, i) => {
            if (!estObjet(nd) || !estTexte(nd.v)) { e.push(`noeud ${i} : "v" (valeur) attendue`); return; }
            for (const k of ['g', 'd']) {
                if (nd[k] !== null && nd[k] !== undefined && (!dansBornes(nd[k], n) || nd[k] === i)) e.push(`noeud ${i} : "${k}" doit être null ou l'indice d'un autre noeud`);
            }
        });
        for (const [nom, cible] of Object.entries(s.pointeurs || {})) if (!dansBornes(cible, n)) e.push(`pointeur ${nom} : indice de noeud attendu`);
        if (s.visites !== undefined && (!Array.isArray(s.visites) || s.visites.some(k => !dansBornes(k, n)))) e.push("visites : liste d'indices de noeuds attendue");
        if (s.courant !== undefined && s.courant !== null && !dansBornes(s.courant, n)) e.push('courant : null ou indice de noeud attendu');
        if (!e.length) {
            const vus = new Set();
            let partage = false;
            const parcourir = i => {
                if (i === null || i === undefined) return;
                if (vus.has(i)) { partage = true; return; }
                vus.add(i);
                parcourir(s.noeuds[i].g);
                parcourir(s.noeuds[i].d);
            };
            parcourir(racine);
            if (partage) e.push('arbre : un noeud a deux parents ou forme un cycle');
        }
    } else {
        e.push('schema : type "liste", "tableau" ou "arbre" attendu');
    }
    return e;
}

// ===== Dessin des schémas (SVG en texte) =====

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PILL_H = 22;
const ECHELLE = 1.45; // les schémas sont dessinés petits puis agrandis
const pillW = nom => 16 + 8.5 * String(nom).length;
let compteurSvg = 0;

function parCible(table) {
    const m = new Map();
    for (const [nom, cible] of Object.entries(table || {})) m.set(cible, [...(m.get(cible) || []), nom]);
    return m;
}

function svgListe(s) {
    const id = `pap-fleche-${++compteurSvg}`;
    const NW = 76, NH = 40, GAP = 54, X0 = 16;
    const n = s.noeuds.length;
    const ptr = parCible(s.pointeurs);
    const piles = [...ptr.values()].map(a => a.length);
    const hautPile = piles.length ? Math.max(...piles) : 0;
    const yN = 10 + (hautPile ? hautPile * PILL_H + 16 : 0);
    const x = i => X0 + i * (NW + GAP);
    const nullPtr = ptr.get(null);
    const aNone = s.noeuds.some(nd => nd.suivant === null || nd.suivant === undefined);
    const distances = s.noeuds.map((nd, i) => (nd.suivant != null && nd.suivant !== i + 1 ? Math.abs(nd.suivant - i) : 0));
    const maxDist = Math.max(0, ...distances);
    const largeur = x(n - 1) + NW + X0 + (nullPtr ? GAP + 56 : 0);
    const bas = yN + NH + (aNone ? 40 : 0) + (maxDist ? 44 + 12 * maxDist : 0) + 14;
    let o = `<svg class="pap-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${bas}" width="${Math.round(largeur * ECHELLE)}" height="${Math.round(bas * ECHELLE)}" role="img" aria-label="Schéma d'une liste chaînée">`;
    o += `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="pap-tete" d="M0,0 L10,5 L0,10 z"/></marker><marker id="${id}p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="pap-tete-ptr" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
    const pastille = (nom, cx, y) => `<rect class="pap-pastille" x="${cx - pillW(nom) / 2}" y="${y}" width="${pillW(nom)}" height="${PILL_H - 4}" rx="9"/><text class="pap-pastille-txt" x="${cx}" y="${y + 13}" text-anchor="middle">${esc(nom)}</text>`;
    const pointeur = (noms, cx, yBas) => {
        let r = '';
        noms.forEach((nom, j) => { r += pastille(nom, cx, yBas - (noms.length - j) * PILL_H - 12); });
        return r + `<line class="pap-trait-ptr" x1="${cx}" y1="${yBas - 12}" x2="${cx}" y2="${yBas - 2}" marker-end="url(#${id}p)"/>`;
    };
    s.noeuds.forEach((nd, i) => {
        const nx = x(i), cx = nx + NW - 15, cy = yN + NH / 2;
        const px = nx + NW - 30;
        o += `<rect class="pap-noeud" x="${nx}" y="${yN}" width="${NW}" height="${NH}" rx="6"/>`;
        o += `<path class="pap-noeud-ptr" d="M${px},${yN} h24 a6,6 0 0 1 6,6 v${NH - 12} a6,6 0 0 1 -6,6 h-24 z"/>`;
        o += `<rect class="pap-noeud-bord" x="${nx}" y="${yN}" width="${NW}" height="${NH}" rx="6"/><line class="pap-noeud-sep" x1="${px}" y1="${yN}" x2="${px}" y2="${yN + NH}"/>`;
        o += `<text class="pap-valeur" x="${nx + (NW - 30) / 2}" y="${cy + 6}" text-anchor="middle">${esc(nd.v)}</text><circle class="pap-point" cx="${cx}" cy="${cy}" r="4.5"/>`;
        if (nd.suivant === null || nd.suivant === undefined) {
            o += `<line class="pap-trait" x1="${cx}" y1="${yN + NH}" x2="${cx}" y2="${yN + NH + 18}" marker-end="url(#${id})"/><text class="pap-none" x="${cx}" y="${yN + NH + 33}" text-anchor="middle">None</text>`;
        } else if (nd.suivant === i + 1) {
            o += `<line class="pap-trait" x1="${cx}" y1="${cy}" x2="${x(i + 1) - 2}" y2="${cy}" marker-end="url(#${id})"/>`;
        } else {
            const ex = x(nd.suivant) + NW / 2, d = 44 + 12 * Math.abs(nd.suivant - i);
            o += `<path class="pap-trait" fill="none" d="M${cx},${yN + NH} Q${(cx + ex) / 2},${yN + NH + d} ${ex},${yN + NH + 2}" marker-end="url(#${id})"/>`;
        }
    });
    for (const [cible, noms] of ptr) if (cible !== null) o += pointeur(noms, x(cible) + NW / 2, yN);
    if (nullPtr) {
        const nx = x(n);
        o += `<rect class="pap-none-boite" x="${nx}" y="${yN + 4}" width="56" height="${NH - 8}" rx="6"/><text class="pap-none" x="${nx + 28}" y="${yN + 25}" text-anchor="middle">None</text>`;
        o += pointeur(nullPtr, nx + 28, yN + 4);
    }
    return o + '</svg>';
}

function svgTableau(s) {
    const CW = 52, CH = 44, PAS = 58, X0 = 16;
    const n = s.cases.length;
    const marques = parCible(s.marques);
    const piles = [...marques.values()].map(a => a.length);
    const haut = piles.length ? Math.max(...piles) : 0;
    const surligne = new Set(s.surligne || []), fixes = new Set(s.fixes || []);
    const largeur = X0 * 2 + (n - 1) * PAS + CW;
    const bas = 10 + CH + 20 + (haut ? 14 + haut * PILL_H : 0) + 8;
    let o = `<svg class="pap-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${bas}" width="${Math.round(largeur * ECHELLE)}" height="${Math.round(bas * ECHELLE)}" role="img" aria-label="Schéma d'un tableau">`;
    s.cases.forEach((c, i) => {
        const cx = X0 + i * PAS;
        const etat = fixes.has(i) ? ' is-fixe' : surligne.has(i) ? ' is-actif' : '';
        o += `<rect class="pap-case${etat}" x="${cx}" y="10" width="${CW}" height="${CH}" rx="6"/><text class="pap-valeur" x="${cx + CW / 2}" y="${10 + CH / 2 + 6}" text-anchor="middle">${esc(c)}</text>`;
        o += `<text class="pap-indice" x="${cx + CW / 2}" y="${10 + CH + 15}" text-anchor="middle">${i}</text>`;
        const noms = marques.get(i);
        if (noms) {
            const y0 = 10 + CH + 22;
            o += `<path class="pap-tete-ptr" d="M${cx + CW / 2 - 5},${y0 + 8} L${cx + CW / 2 + 5},${y0 + 8} L${cx + CW / 2},${y0} z"/>`;
            noms.forEach((nom, j) => {
                const y = y0 + 10 + j * PILL_H;
                o += `<rect class="pap-pastille" x="${cx + CW / 2 - pillW(nom) / 2}" y="${y}" width="${pillW(nom)}" height="${PILL_H - 4}" rx="9"/><text class="pap-pastille-txt" x="${cx + CW / 2}" y="${y + 13}" text-anchor="middle">${esc(nom)}</text>`;
            });
        }
    });
    return o + '</svg>';
}

// Arbre binaire : abscisse = rang du noeud en ordre infixe, ordonnée = profondeur. Les pointeurs sont des pastilles à droite du noeud.
function svgArbre(s) {
    const R = 20, XPAS = 54, YPAS = 64, X0 = 24, Y0 = 18;
    const racine = s.racine ?? 0;
    const pos = new Map();
    let rang = 0, profMax = 0;
    const placer = (i, p) => {
        if (i === null || i === undefined) return;
        placer(s.noeuds[i].g, p + 1);
        pos.set(i, { x: X0 + R + rang++ * XPAS, y: Y0 + R + p * YPAS });
        profMax = Math.max(profMax, p);
        placer(s.noeuds[i].d, p + 1);
    };
    placer(racine, 0);
    const ptr = parCible(s.pointeurs);
    const largeur = X0 * 2 + R * 2 + (rang - 1) * XPAS + 56;
    const bas = Y0 * 2 + R * 2 + profMax * YPAS;
    const visites = new Set(s.visites || []);
    let o = `<svg class="pap-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${bas}" width="${Math.round(largeur * ECHELLE)}" height="${Math.round(bas * ECHELLE)}" role="img" aria-label="Schéma d'un arbre binaire">`;
    for (const [i, c] of pos) {
        for (const k of ['g', 'd']) {
            const f = s.noeuds[i][k];
            if (f !== null && f !== undefined) o += `<line class="pap-trait" x1="${c.x}" y1="${c.y}" x2="${pos.get(f).x}" y2="${pos.get(f).y}"/>`;
        }
    }
    for (const [i, c] of pos) {
        const etat = s.courant === i ? ' is-courant' : visites.has(i) ? ' is-visite' : '';
        o += `<circle class="pap-noeud-arbre${etat}" cx="${c.x}" cy="${c.y}" r="${R}"/><text class="pap-valeur" x="${c.x}" y="${c.y + 6}" text-anchor="middle">${esc(s.noeuds[i].v)}</text>`;
        (ptr.get(i) || []).forEach((nom, j) => {
            const y = c.y - R + j * PILL_H;
            o += `<rect class="pap-pastille" x="${c.x + R + 2}" y="${y}" width="${pillW(nom)}" height="${PILL_H - 4}" rx="9"/><text class="pap-pastille-txt" x="${c.x + R + 2 + pillW(nom) / 2}" y="${y + 13}" text-anchor="middle">${esc(nom)}</text>`;
        });
    }
    return o + '</svg>';
}

const dessiner = s => (s.type === 'liste' ? svgListe(s) : s.type === 'tableau' ? svgTableau(s) : svgArbre(s));

// ===== Composant =====

// Pour chaque étape : ligne courante, note, variables cumulées (celles qui viennent de changer sont signalées) et schéma (hérité si non redonné).
function etatsDe(def) {
    const etats = [];
    let vars = {}, schema = null;
    for (const et of def.etapes) {
        const changees = new Set(Object.keys(et.vars || {}));
        vars = { ...vars, ...(et.vars || {}) };
        if (et.schema) schema = et.schema;
        etats.push({ ligne: et.ligne ?? null, note: et.note || '', vars, changees, schema });
    }
    return etats;
}

function bouton(classe, texte) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${classe} btn-sm`;
    b.textContent = texte;
    return b;
}

function construire(def) {
    const etats = etatsDe(def);
    let i = 0;
    const racine = document.createElement('div');
    racine.className = 'pap';
    racine.tabIndex = 0;
    racine.setAttribute('role', 'group');
    racine.setAttribute('aria-label', def.titre || 'Exécution pas à pas');

    const titre = document.createElement('p');
    titre.className = 'pap-titre';
    titre.textContent = def.titre || 'Pas à pas';
    const corps = document.createElement('div');
    corps.className = 'pap-corps';
    const code = document.createElement('div');
    code.className = 'pap-code';
    const lignes = def.code.map(texte => {
        const l = document.createElement('div');
        l.className = 'pap-ligne';
        l.textContent = texte || ' ';
        code.appendChild(l);
        return l;
    });
    const droite = document.createElement('div');
    droite.className = 'pap-droite';
    const schemaEl = document.createElement('div');
    schemaEl.className = 'pap-schema';
    const varsEl = document.createElement('div');
    varsEl.className = 'pap-vars';
    droite.append(schemaEl, varsEl);
    corps.append(code, droite);
    const note = document.createElement('p');
    note.className = 'pap-note';
    note.setAttribute('aria-live', 'polite');
    const nav = document.createElement('div');
    nav.className = 'pap-nav';
    const bPrec = bouton('btn-secondary', 'Précédent');
    const compteur = document.createElement('span');
    compteur.className = 'pap-compteur';
    const bSuiv = bouton('btn-primary', 'Suivant');
    const bRecom = bouton('btn-ghost', 'Recommencer');
    nav.append(bPrec, compteur, bSuiv, bRecom);
    racine.append(titre, corps, note, nav);

    function afficher() {
        const e = etats[i];
        lignes.forEach((l, k) => l.classList.toggle('is-courante', k === e.ligne));
        schemaEl.hidden = !e.schema;
        schemaEl.innerHTML = e.schema ? dessiner(e.schema) : '';
        const noms = Object.keys(e.vars);
        varsEl.hidden = noms.length === 0;
        varsEl.replaceChildren();
        for (const nom of noms) {
            const p = document.createElement('span');
            p.className = `pap-var${e.changees.has(nom) ? ' is-changee' : ''}`;
            const k = document.createElement('b');
            k.textContent = nom;
            p.append(k, ` = ${e.vars[nom]}`);
            varsEl.appendChild(p);
        }
        note.textContent = e.note;
        note.hidden = !e.note;
        compteur.textContent = `Étape ${i + 1} sur ${etats.length}`;
        bPrec.disabled = i === 0;
        bSuiv.disabled = i === etats.length - 1;
        bRecom.hidden = i === 0;
    }
    const aller = k => { i = Math.max(0, Math.min(etats.length - 1, k)); afficher(); };
    bPrec.addEventListener('click', () => aller(i - 1));
    bSuiv.addEventListener('click', () => aller(i + 1));
    bRecom.addEventListener('click', () => aller(0));
    racine.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); aller(i + 1); }
        else if (ev.key === 'ArrowLeft') { ev.preventDefault(); aller(i - 1); }
    });
    afficher();
    return racine;
}

// Remplace chaque bloc « pas-a-pas » déjà rendu par marked (<pre><code class="language-pas-a-pas">) par le composant.
export function activerPasAPas(racine) {
    racine.querySelectorAll('pre > code.language-pas-a-pas').forEach(code => {
        const pre = code.parentElement;
        let message = null;
        let def = null;
        try { def = JSON.parse(code.textContent); } catch { message = 'JSON illisible'; }
        if (!message) message = validerPasAPas(def)[0] || null;
        if (message) {
            const p = document.createElement('p');
            p.className = 'seance-erreur';
            p.textContent = `Exécution pas à pas illisible (${message}).`;
            pre.replaceWith(p);
            return;
        }
        pre.replaceWith(construire(def));
    });
}
