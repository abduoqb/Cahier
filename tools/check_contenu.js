// Vérifie contenu/ : index, fichiers, schéma des quiz et des cartes, ids uniques, longueurs, annale réservée.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validerPasAPas } from '../js/pas-a-pas.js';
import { TYPES, totalBareme } from '../js/correction.js';

const RESERVEES = [/2023-2024/];
const MAX_ENONCE = 400;
const MAX_CHOIX = 120;
const FICHIERS = ['cours.md', 'condense.md', 'quiz.json'];
const MAX_RECTO = 200;
const MAX_CORRIGE = 1500;
const MAX_LIGNES_CODE = 30;
const MAX_VERSO = 120;

function verifierCartes(s, ou, dossier, ids, erreurs) {
    const p = path.join(dossier, 'cartes.json');
    if (!s.cartes) {
        if (fs.existsSync(p)) erreurs.push(`${ou} : cartes.json présent sans "cartes": true dans l'index`);
        return;
    }
    let c;
    try { c = JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { erreurs.push(`${ou} : "cartes": true mais cartes.json illisible (${e.message})`); return; }
    if (c.seance !== s.id) erreurs.push(`${ou} : cartes.seance vaut "${c.seance}", attendu "${s.id}"`);
    if (!Array.isArray(c.cartes) || c.cartes.length === 0) { erreurs.push(`${ou} : cartes.json sans cartes`); return; }
    const declarees = new Set(s.notions || []);
    const motif = new RegExp(`^c-${s.id}-\\d{3}$`);
    const reservee = t => typeof t === 'string' && RESERVEES.some(r => r.test(t));
    for (const k of c.cartes) {
        const ko = `${ou} ${k.id}`;
        if (!motif.test(k.id || '')) erreurs.push(`${ko} : id invalide (attendu c-${s.id}-nnn)`);
        if (ids.has(k.id)) erreurs.push(`${ko} : id en double`);
        ids.add(k.id);
        if (!declarees.has(k.notion)) erreurs.push(`${ko} : notion "${k.notion}" absente de l'index`);
        if (typeof k.recto !== 'string' || !k.recto.trim() || k.recto.length > MAX_RECTO) erreurs.push(`${ko} : recto vide ou trop long`);
        if (typeof k.verso !== 'string' || !k.verso.trim() || k.verso.length > MAX_VERSO || /[\r\n]/.test(k.verso)) {
            erreurs.push(`${ko} : verso vide, trop long ou sur plusieurs lignes`);
        }
        if (typeof k.source !== 'string' || !k.source.trim()) erreurs.push(`${ko} : source manquante`);
        if ([k.source, k.recto, k.verso].some(reservee)) erreurs.push(`${ko} : annale réservée aux tests blancs`);
    }
}

const texte = (v, max) => typeof v === 'string' && v.trim() !== '' && v.length <= max;

function verifierSpecifique(q, qo, erreurs) {
    switch (q.type) {
        case 'qcm':
            if (!Array.isArray(q.choix) || q.choix.length < 2 || q.choix.length > 5) erreurs.push(`${qo} : il faut 2 à 5 choix`);
            else {
                q.choix.forEach(c => { if (typeof c !== 'string' || !c || c.length > MAX_CHOIX) erreurs.push(`${qo} : choix vide ou trop long`); });
                if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= q.choix.length) erreurs.push(`${qo} : bonne hors bornes`);
            }
            break;
        case 'courte':
            if (!Array.isArray(q.reponses) || q.reponses.length < 1 || q.reponses.length > 8 || q.reponses.some(r => !texte(r, MAX_CHOIX))) {
                erreurs.push(`${qo} : "reponses" doit contenir 1 à 8 textes de ${MAX_CHOIX} caractères maximum`);
            }
            if (q.mode !== undefined && q.mode !== 'texte' && q.mode !== 'commande') erreurs.push(`${qo} : mode "texte" ou "commande"`);
            break;
        case 'trace': {
            const codeOk = Array.isArray(q.code) && q.code.length >= 1 && q.code.length <= MAX_LIGNES_CODE && q.code.every(l => typeof l === 'string');
            if (!codeOk) erreurs.push(`${qo} : "code" doit être un tableau de 1 à ${MAX_LIGNES_CODE} lignes`);
            const noms = q.attendu && typeof q.attendu === 'object' && !Array.isArray(q.attendu) ? Object.keys(q.attendu) : [];
            if (noms.length < 1 || noms.length > 6 || noms.some(n => !texte(String(q.attendu[n]), MAX_CHOIX))) {
                erreurs.push(`${qo} : "attendu" doit associer 1 à 6 variables à une valeur de ${MAX_CHOIX} caractères maximum`);
            }
            if (q.pasAPas !== undefined) {
                if (!codeOk) break;
                try { for (const m of validerPasAPas({ ...q.pasAPas, code: q.code })) erreurs.push(`${qo} : pasAPas : ${m}`); }
                catch (e) { erreurs.push(`${qo} : pasAPas illisible (${e.message})`); }
            }
            break;
        }
        case 'ordre': {
            const el = q.elements;
            if (!Array.isArray(el) || el.length < 3 || el.length > 10 || el.some(e => !texte(e, MAX_CHOIX))) erreurs.push(`${qo} : "elements" doit contenir 3 à 10 textes de ${MAX_CHOIX} caractères maximum`);
            else if (new Set(el).size !== el.length) erreurs.push(`${qo} : "elements" contient un doublon`);
            break;
        }
        case 'redaction': {
            const b = q.bareme;
            if (!Array.isArray(b) || b.length < 1 || b.length > 8 || b.some(c => !c || !texte(c.critere, MAX_CHOIX) || !(typeof c.points === 'number' && c.points > 0))) {
                erreurs.push(`${qo} : "bareme" doit contenir 1 à 8 critères {critere, points > 0}`);
            } else if (q.points !== undefined && q.points !== totalBareme(q)) erreurs.push(`${qo} : points (${q.points}) différent de la somme du barème (${totalBareme(q)})`);
            if (!texte(q.corrige, MAX_CORRIGE)) erreurs.push(`${qo} : "corrige" vide ou de plus de ${MAX_CORRIGE} caractères`);
            break;
        }
    }
}

// Champs communs à tous les types. partiel : question de partiel-blanc.json (annale 2023-2024 permise, partielBlanc: true obligatoire).
function verifierQuestion(q, qo, { motif, ids, partiel, erreurs }) {
    if (!motif.test(q.id || '')) erreurs.push(`${qo} : id invalide (attendu ${motif.source})`);
    if (ids.has(q.id)) erreurs.push(`${qo} : id en double`);
    ids.add(q.id);
    if (!TYPES.includes(q.type)) erreurs.push(`${qo} : type "${q.type}" inconnu (${TYPES.join(', ')})`);
    if (partiel && q.partielBlanc !== true) erreurs.push(`${qo} : "partielBlanc": true obligatoire dans partiel-blanc.json`);
    if (!partiel && q.partielBlanc !== undefined) erreurs.push(`${qo} : "partielBlanc" n'est permis que dans partiel-blanc.json`);
    if (!q.enonce || q.enonce.length > MAX_ENONCE) erreurs.push(`${qo} : énoncé vide ou trop long`);
    verifierSpecifique(q, qo, erreurs);
    if (!q.explication) erreurs.push(`${qo} : explication manquante`);
    if (!q.source || !q.source.trim()) erreurs.push(`${qo} : source manquante`);
    else if (!partiel && RESERVEES.some(r => r.test(JSON.stringify(q)))) erreurs.push(`${qo} : annale réservée aux tests blancs`);
}

function verifierPartiel(m, racine, ids, erreurs) {
    const p = path.join(racine, m.id, 'partiel-blanc.json');
    const existe = fs.existsSync(p);
    if (!existe) { if (m.partielBlanc) erreurs.push(`${m.id} : "partielBlanc": true dans l'index mais partiel-blanc.json absent`); return; }
    if (!m.partielBlanc) erreurs.push(`${m.id} : partiel-blanc.json présent sans "partielBlanc": true sur la matière dans l'index`);
    let f;
    try { f = JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { erreurs.push(`${m.id} : partiel-blanc.json illisible (${e.message})`); return; }
    const ou = `${m.id}/partiel-blanc`;
    if (f.matiere !== m.id) erreurs.push(`${ou} : matiere vaut "${f.matiere}", attendu "${m.id}"`);
    if (!Number.isInteger(f.duree) || f.duree < 10 || f.duree > 360) erreurs.push(`${ou} : duree en minutes (entier de 10 à 360)`);
    if (!Array.isArray(f.questions) || f.questions.length === 0) { erreurs.push(`${ou} : aucune question`); return; }
    const notions = new Map((m.seances || []).map(s => [s.id, new Set(s.notions || [])]));
    const motif = new RegExp(`^p-${m.id}-\\d{3}$`);
    for (const q of f.questions) {
        const qo = `${ou} ${q.id}`;
        verifierQuestion(q, qo, { motif, ids, partiel: true, erreurs });
        if (!notions.has(q.seance)) erreurs.push(`${qo} : seance "${q.seance}" absente de la matière`);
        else if (!notions.get(q.seance).has(q.notion)) erreurs.push(`${qo} : notion "${q.notion}" absente de la séance ${q.seance}`);
        if (q.points !== undefined && !(typeof q.points === 'number' && q.points > 0)) erreurs.push(`${qo} : points doit être un nombre positif`);
        if (q.sujet !== undefined && !texte(q.sujet, 80)) erreurs.push(`${qo} : sujet en texte de 80 caractères maximum`);
    }
}

export function verifierContenu(racine, avertissements = []) {
    const erreurs = [];
    let index;
    try { index = JSON.parse(fs.readFileSync(path.join(racine, 'index.json'), 'utf8')); }
    catch (e) { return [`index.json illisible : ${e.message}`]; }

    const ids = new Set();
    const idsCartes = new Set();
    for (const m of index.matieres || []) {
        verifierPartiel(m, racine, ids, erreurs);
        for (const s of m.seances || []) {
            const ou = `${m.id}/${s.id}`;
            const dossier = path.join(racine, s.dossier || '');
            for (const f of FICHIERS) {
                if (!fs.existsSync(path.join(dossier, f))) erreurs.push(`${ou} : fichier manquant ${f}`);
            }
            if (!fs.existsSync(path.join(dossier, 'support.pdf')) && !fs.existsSync(path.join(dossier, 'fiche.pdf'))) avertissements.push(`avertissement : ${ou} : support.pdf absent (non versionné)`);
            for (const f of ['cours.md', 'condense.md']) {
                const p = path.join(dossier, f);
                if (!fs.existsSync(p)) continue;
                const txt = fs.readFileSync(p, 'utf8');
                if (RESERVEES.some(r => r.test(txt))) erreurs.push(`${ou}/${f} : mention d'une annale réservée`);
                // Les doubles crochets de bash ([[ -n $x ]]) sont autorisés dans le code : on ne cherche les wikilinks que dans le texte.
                const horsCode = txt.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
                if (/\[\[[^\]]+\]\]/.test(horsCode)) erreurs.push(`${ou}/${f} : wikilink [[…]] interdit`);
                if (/^>\s*\[!/m.test(txt)) erreurs.push(`${ou}/${f} : callout Obsidian interdit`);
                for (const bloc of txt.matchAll(/```pas-a-pas\r?\n([\s\S]*?)\r?\n```/g)) {
                    try { for (const m of validerPasAPas(JSON.parse(bloc[1]))) erreurs.push(`${ou}/${f} : pas-a-pas : ${m}`); }
                    catch (e) { erreurs.push(`${ou}/${f} : pas-a-pas : JSON illisible (${e.message})`); }
                }
                for (const mm of txt.matchAll(/\]\((img\/[^)\s]+)\)/g)) {
                    if (!fs.existsSync(path.join(dossier, mm[1]))) erreurs.push(`${ou}/${f} : image absente ${mm[1]}`);
                }
            }
            verifierCartes(s, ou, dossier, idsCartes, erreurs);
            let quiz;
            try { quiz = JSON.parse(fs.readFileSync(path.join(dossier, 'quiz.json'), 'utf8')); }
            catch (e) { erreurs.push(`${ou} : quiz.json illisible (${e.message})`); continue; }
            if (quiz.seance !== s.id) erreurs.push(`${ou} : quiz.seance vaut "${quiz.seance}", attendu "${s.id}"`);
            const declarees = new Set(s.notions || []);
            const vues = new Set();
            const motif = /^q-[a-z0-9-]+$/;
            for (const q of quiz.questions || []) {
                const qo = `${ou} ${q.id}`;
                verifierQuestion(q, qo, { motif, ids, partiel: false, erreurs });
                if (!declarees.has(q.notion)) erreurs.push(`${qo} : notion "${q.notion}" absente de l'index`);
                vues.add(q.notion);
            }
            for (const n of declarees) if (!vues.has(n)) erreurs.push(`${ou} : notion "${n}" sans question`);
            // Avertissements de qualité : une bonne réponse qui se devine à sa longueur ou à sa place.
            const qcm = (quiz.questions || []).filter(q => Array.isArray(q.choix) && Number.isInteger(q.bonne) && q.choix[q.bonne] !== undefined);
            if (qcm.length >= 6) {
                const plusLongue = qcm.filter(q => { const L = q.choix.map(c => c.length); const max = Math.max(...L); return L[q.bonne] === max && L.filter(x => x === max).length === 1; }).length;
                if (plusLongue / qcm.length > 0.5) avertissements.push(`avertissement : ${ou} : la bonne réponse est strictement la plus longue dans ${plusLongue} questions sur ${qcm.length} (allonger les distracteurs)`);
                if (new Set(qcm.map(q => q.bonne)).size === 1) avertissements.push(`avertissement : ${ou} : toutes les questions ont bonne = ${qcm[0].bonne} (varier la place de la bonne réponse)`);
            }
        }
    }
    return erreurs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const avertissements = [];
    const erreurs = verifierContenu(process.argv[2] || 'contenu', avertissements);
    if (avertissements.length) console.error(avertissements.join('\n'));
    if (erreurs.length) { console.error(erreurs.join('\n')); process.exit(1); }
    console.log('contenu OK');
}
