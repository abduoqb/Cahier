// Vérifie contenu/ : index, fichiers, schéma des quiz, ids uniques, longueurs, annale réservée.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RESERVEES = [/2023-2024/];
const MAX_ENONCE = 400;
const MAX_CHOIX = 120;
const FICHIERS = ['cours.md', 'condense.md', 'quiz.json', 'support.pdf'];

export function verifierContenu(racine) {
    const erreurs = [];
    let index;
    try { index = JSON.parse(fs.readFileSync(path.join(racine, 'index.json'), 'utf8')); }
    catch (e) { return [`index.json illisible : ${e.message}`]; }

    const ids = new Set();
    for (const m of index.matieres || []) {
        for (const s of m.seances || []) {
            const ou = `${m.id}/${s.id}`;
            const dossier = path.join(racine, s.dossier || '');
            for (const f of FICHIERS) {
                if (!fs.existsSync(path.join(dossier, f))) erreurs.push(`${ou} : fichier manquant ${f}`);
            }
            for (const f of ['cours.md', 'condense.md']) {
                const p = path.join(dossier, f);
                if (!fs.existsSync(p)) continue;
                const txt = fs.readFileSync(p, 'utf8');
                if (/\[\[[^\]]+\]\]/.test(txt)) erreurs.push(`${ou}/${f} : wikilink [[…]] interdit`);
                if (/^>\s*\[!/m.test(txt)) erreurs.push(`${ou}/${f} : callout Obsidian interdit`);
                for (const mm of txt.matchAll(/\]\((img\/[^)\s]+)\)/g)) {
                    if (!fs.existsSync(path.join(dossier, mm[1]))) erreurs.push(`${ou}/${f} : image absente ${mm[1]}`);
                }
            }
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
        }
    }
    return erreurs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const erreurs = verifierContenu(process.argv[2] || 'contenu');
    if (erreurs.length) { console.error(erreurs.join('\n')); process.exit(1); }
    console.log('contenu OK');
}
