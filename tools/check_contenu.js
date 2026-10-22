// Vérifie contenu/ : index, fichiers, schéma des quiz et des cartes, ids uniques, longueurs, annale réservée.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validerPasAPas } from '../js/pas-a-pas.js';

const RESERVEES = [/2023-2024/];
const MAX_ENONCE = 400;
const MAX_CHOIX = 120;
const FICHIERS = ['cours.md', 'condense.md', 'quiz.json'];
const MAX_RECTO = 200;
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

export function verifierContenu(racine, avertissements = []) {
    const erreurs = [];
    let index;
    try { index = JSON.parse(fs.readFileSync(path.join(racine, 'index.json'), 'utf8')); }
    catch (e) { return [`index.json illisible : ${e.message}`]; }

    const ids = new Set();
    const idsCartes = new Set();
    for (const m of index.matieres || []) {
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
            for (const q of quiz.questions || []) {
                const qo = `${ou} ${q.id}`;
                if (!/^q-[a-z0-9-]+$/.test(q.id || '')) erreurs.push(`${qo} : id invalide`);
                if (ids.has(q.id)) erreurs.push(`${qo} : id en double`);
                ids.add(q.id);
                if (q.type !== 'qcm') erreurs.push(`${qo} : type "${q.type}" non géré en v1`);
                if (!declarees.has(q.notion)) erreurs.push(`${qo} : notion "${q.notion}" absente de l'index`);
                vues.add(q.notion);
                if (!q.enonce || q.enonce.length > MAX_ENONCE) erreurs.push(`${qo} : énoncé vide ou trop long`);
                if (!Array.isArray(q.choix) || q.choix.length < 2 || q.choix.length > 5) erreurs.push(`${qo} : il faut 2 à 5 choix`);
                else {
                    q.choix.forEach(c => { if (typeof c !== 'string' || !c || c.length > MAX_CHOIX) erreurs.push(`${qo} : choix vide ou trop long`); });
                    if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= q.choix.length) erreurs.push(`${qo} : bonne hors bornes`);
                }
                if (!q.explication) erreurs.push(`${qo} : explication manquante`);
                if (!q.source || !q.source.trim()) erreurs.push(`${qo} : source manquante`);
                else if (RESERVEES.some(r => r.test(q.source))) erreurs.push(`${qo} : annale réservée aux tests blancs`);
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
