import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verifierContenu } from '../tools/check_contenu.js';

function fixture(modifierQuiz = q => q) {
    const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'contenu-'));
    const dossier = path.join(racine, 'algo', 'cm1');
    fs.mkdirSync(path.join(dossier, 'img'), { recursive: true });
    fs.writeFileSync(path.join(dossier, 'cours.md'), '# Cours\n');
    fs.writeFileSync(path.join(dossier, 'condense.md'), '![s](img/a.svg)\n');
    fs.writeFileSync(path.join(dossier, 'img', 'a.svg'), '<svg/>');
    fs.writeFileSync(path.join(dossier, 'support.pdf'), '%PDF');
    const quiz = { seance: 'cm1', questions: [
        { id: 'q-cm1-001', notion: 'tableaux', type: 'qcm', enonce: 'Question ?', choix: ['a', 'b'], bonne: 1, explication: 'Parce que.', source: 'annale 2024-2025 ex. 1 Q1' },
        { id: 'q-cm1-002', notion: 'tableaux', type: 'qcm', enonce: 'Autre ?', choix: ['a', 'b', 'c'], bonne: 0, explication: 'Oui.', source: 'TD1 ex. 2' },
    ] };
    fs.writeFileSync(path.join(dossier, 'quiz.json'), JSON.stringify(modifierQuiz(quiz)));
    fs.writeFileSync(path.join(racine, 'index.json'), JSON.stringify({ matieres: [{ id: 'algo', nom: 'Algo', seances: [
        { id: 'cm1', type: 'CM', titre: 'Tableaux', dossier: 'algo/cm1', notions: ['tableaux'] } ] }] }));
    return racine;
}

test('contenu valide : aucune erreur', () => {
    assert.deepEqual(verifierContenu(fixture()), []);
});

test('id en double', () => {
    const e = verifierContenu(fixture(q => { q.questions[1].id = 'q-cm1-001'; return q; }));
    assert.ok(e.some(m => m.includes('en double')), e.join('\n'));
});

test('bonne hors bornes', () => {
    const e = verifierContenu(fixture(q => { q.questions[0].bonne = 5; return q; }));
    assert.ok(e.some(m => m.includes('bonne')), e.join('\n'));
});

test('notion non déclarée dans l\'index', () => {
    const e = verifierContenu(fixture(q => { q.questions[0].notion = 'inconnue'; return q; }));
    assert.ok(e.some(m => m.includes('inconnue')), e.join('\n'));
});

test('annale réservée citée en source', () => {
    const e = verifierContenu(fixture(q => { q.questions[0].source = 'annale 2023-2024 ex. 1'; return q; }));
    assert.ok(e.some(m => m.includes('réservée')), e.join('\n'));
});

test('choix trop long et source vide', () => {
    const e = verifierContenu(fixture(q => { q.questions[0].choix[0] = 'x'.repeat(121); q.questions[1].source = ''; return q; }));
    assert.ok(e.some(m => m.includes('trop long')) && e.some(m => m.includes('source')), e.join('\n'));
});

test('doubles crochets de bash autorisés dans le code, wikilink refusé dans le texte', () => {
    const racine = fixture();
    const cours = path.join(racine, 'algo', 'cm1', 'cours.md');
    fs.writeFileSync(cours, ['Test :', '```bash', 'if [[ -n "$a" ]]; then echo ok; fi', '```', 'et `[[ -e f ]]` en ligne.', ''].join('\n'));
    assert.deepEqual(verifierContenu(racine), []);
    fs.writeFileSync(cours, ['```bash', '[[ -n $a ]]', '```', 'Voir [[Autre note]]', ''].join('\n'));
    assert.ok(verifierContenu(racine).some(m => m.includes('wikilink')));
});

test('avertissement : bonne réponse toujours la plus longue ou toujours à la même place', () => {
    const racine = fixture(q => {
        q.questions = Array.from({ length: 6 }, (_, i) => ({
            id: `q-cm1-${String(i + 1).padStart(3, '0')}`, notion: 'tableaux', type: 'qcm', enonce: 'Q ?',
            choix: ['une réponse bien plus longue', 'non', 'faux'], bonne: 0, explication: 'Oui.', source: 'TD1',
        }));
        return q;
    });
    const avertissements = [];
    assert.deepEqual(verifierContenu(racine, avertissements), []);
    assert.ok(avertissements.some(m => m.includes('la plus longue')) && avertissements.some(m => m.includes('bonne = 0')), avertissements.join('\n'));
});

test('image manquante et wikilink', () => {
    const racine = fixture();
    fs.writeFileSync(path.join(racine, 'algo', 'cm1', 'cours.md'), 'Voir [[Autre note]] ![x](img/absente.svg)');
    const e = verifierContenu(racine);
    assert.ok(e.some(m => m.includes('absente.svg')) && e.some(m => m.includes('wikilink')), e.join('\n'));
});

test('annale réservée citée dans cours.md ou condense.md', () => {
    for (const f of ['cours.md', 'condense.md']) {
        const racine = fixture();
        fs.writeFileSync(path.join(racine, 'algo', 'cm1', f), 'Annale 2023-2024 : 4 pts\n');
        const e = verifierContenu(racine);
        assert.ok(e.some(m => m.includes(`algo/cm1/${f} : mention d'une annale réservée`)), e.join('\n'));
    }
});

test('support.pdf absent : avertissement, pas d\'erreur', () => {
    const racine = fixture();
    fs.rmSync(path.join(racine, 'algo', 'cm1', 'support.pdf'));
    const avertissements = [];
    assert.deepEqual(verifierContenu(racine, avertissements), []);
    assert.ok(avertissements.some(m => m.includes('support.pdf')), avertissements.join('\n'));
});

function avecCartes(racine, cartes, { drapeau = true, seance = 'cm1' } = {}) {
    if (cartes !== null) fs.writeFileSync(path.join(racine, 'algo', 'cm1', 'cartes.json'), JSON.stringify({ seance, cartes }));
    if (drapeau) {
        const p = path.join(racine, 'index.json');
        const idx = JSON.parse(fs.readFileSync(p, 'utf8'));
        idx.matieres[0].seances[0].cartes = true;
        fs.writeFileSync(p, JSON.stringify(idx));
    }
    return racine;
}
const carte = (o = {}) => ({ id: 'c-cm1-001', notion: 'tableaux', recto: 'Coût du parcours complet ?', verso: 'O(n).', source: 'TD1 ex. 2', ...o });
const contient = (erreurs, motif) => erreurs.some(e => e.includes(motif));

test('cartes valides : aucune erreur', () => {
    assert.deepEqual(verifierContenu(avecCartes(fixture(), [carte(), carte({ id: 'c-cm1-002' })])), []);
});

test('cartes : drapeau sans fichier', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), null)), 'cartes.json illisible'));
});

test('cartes : fichier sans drapeau', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte()], { drapeau: false })), 'sans "cartes": true'));
});

test('cartes : seance incohérente et liste vide', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte()], { seance: 'autre' })), 'cartes.seance'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [])), 'sans cartes'));
});

test('cartes : id invalide ou en double', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ id: 'c-autre-001' })])), 'id invalide'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte(), carte()])), 'id en double'));
});

test('cartes : notion absente de l\'index', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ notion: 'inconnue' })])), 'absente de l\'index'));
});

test('cartes : longueurs et verso sur une ligne', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ recto: 'x'.repeat(201) })])), 'recto'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ verso: 'x'.repeat(121) })])), 'verso'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ verso: 'ligne 1\nligne 2' })])), 'plusieurs lignes'));
    assert.deepEqual(verifierContenu(avecCartes(fixture(), [carte({ recto: 'x'.repeat(200), verso: 'y'.repeat(120) })])), []);
});

test('cartes : source manquante ou annale réservée', () => {
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ source: ' ' })])), 'source manquante'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ source: 'annale 2023-2024 ex. 1' })])), 'annale réservée'));
    assert.ok(contient(verifierContenu(avecCartes(fixture(), [carte({ verso: 'Vu en 2023-2024.' })])), 'annale réservée'));
});

// ===== Types de question et partiel blanc =====

const qBase = { notion: 'tableaux', enonce: 'Énoncé ?', explication: 'Parce que.', source: 'TD1 ex. 1' };
const avecQuestions = (...qs) => fixture(quiz => ({ ...quiz, questions: [...quiz.questions, ...qs] }));
const erreursDe = q => verifierContenu(avecQuestions({ ...qBase, id: 'q-cm1-010', ...q })).join('\n');

test('courte valide, mode commande valide', () => {
    assert.equal(erreursDe({ type: 'courte', reponses: ['pile'] }), '');
    assert.equal(erreursDe({ type: 'courte', mode: 'commande', reponses: ['ls -l'] }), '');
});

test('courte invalide : sans réponses, mode inconnu', () => {
    assert.match(erreursDe({ type: 'courte', reponses: [] }), /reponses/);
    assert.match(erreursDe({ type: 'courte', mode: 'x', reponses: ['a'] }), /mode/);
});

test('trace valide et pas-à-pas contrôlé', () => {
    const t = { type: 'trace', code: ['x = 1', 'x = x + 2'], attendu: { x: '3' } };
    assert.equal(erreursDe(t), '');
    const pap = { etapes: [{ ligne: 1, vars: { x: 3 } }] };
    assert.equal(erreursDe({ ...t, pasAPas: pap }), '');
    assert.match(erreursDe({ ...t, pasAPas: { etapes: [{ ligne: 9 }] } }), /pasAPas : étape 1 : ligne hors du code/);
});

test('trace invalide : sans code, sans variable attendue', () => {
    assert.match(erreursDe({ type: 'trace', attendu: { x: '3' } }), /"code"/);
    assert.match(erreursDe({ type: 'trace', code: ['x = 1'], attendu: {} }), /"attendu"/);
});

test('ordre valide ; trop court, doublon', () => {
    assert.equal(erreursDe({ type: 'ordre', elements: ['a', 'b', 'c'] }), '');
    assert.match(erreursDe({ type: 'ordre', elements: ['a', 'b'] }), /elements/);
    assert.match(erreursDe({ type: 'ordre', elements: ['a', 'b', 'a'] }), /doublon/);
});

test('redaction valide ; barème absent, points incohérents, corrigé absent', () => {
    const r = { type: 'redaction', bareme: [{ critere: 'a', points: 2 }, { critere: 'b', points: 1 }], corrige: 'Réponse type.' };
    assert.equal(erreursDe(r), '');
    assert.match(erreursDe({ ...r, bareme: [] }), /bareme/);
    assert.match(erreursDe({ ...r, points: 5 }), /somme du barème/);
    assert.match(erreursDe({ ...r, corrige: '' }), /corrige/);
});

test('type inconnu, partielBlanc interdit dans un quiz normal', () => {
    assert.match(erreursDe({ type: 'dessin' }), /type "dessin" inconnu/);
    assert.match(erreursDe({ type: 'qcm', choix: ['a', 'b'], bonne: 0, partielBlanc: true }), /partielBlanc/);
});

test('annale 2023-2024 refusée dans un quiz normal', () => {
    assert.match(erreursDe({ type: 'courte', reponses: ['a'], source: 'Annale 2023-2024 ex. 1' }), /annale réservée/);
});

function avecPartiel(questions, { flag = true, duree = 120, ecrire = true } = {}) {
    const racine = fixture();
    const idx = JSON.parse(fs.readFileSync(path.join(racine, 'index.json'), 'utf8'));
    if (flag) idx.matieres[0].partielBlanc = true;
    fs.writeFileSync(path.join(racine, 'index.json'), JSON.stringify(idx));
    if (ecrire) fs.writeFileSync(path.join(racine, 'algo', 'partiel-blanc.json'), JSON.stringify({ matiere: 'algo', duree, questions }));
    return racine;
}
const qp = (o = {}) => ({ id: 'p-algo-001', partielBlanc: true, seance: 'cm1', notion: 'tableaux', type: 'courte', reponses: ['a'],
    enonce: 'Q ?', explication: 'Oui.', source: 'Annale 2023-2024, exercice 1', points: 2, ...o });

test('partiel blanc valide : annale 2023-2024 permise', () => {
    assert.deepEqual(verifierContenu(avecPartiel([qp()])), []);
});

test('partiel blanc : partielBlanc obligatoire, seance et notion connues, id p-', () => {
    const e = verifierContenu(avecPartiel([qp({ partielBlanc: undefined, seance: 'zz', id: 'q-algo-001' })])).join('\n');
    assert.match(e, /partielBlanc": true obligatoire/);
    assert.match(e, /seance "zz" absente/);
    assert.match(e, /id invalide/);
    assert.match(verifierContenu(avecPartiel([qp({ notion: 'autre' })])).join('\n'), /notion "autre" absente de la séance/);
});

test('partiel blanc : durée, drapeau d\'index, fichier manquant', () => {
    assert.match(verifierContenu(avecPartiel([qp()], { duree: 5 })).join('\n'), /duree/);
    assert.match(verifierContenu(avecPartiel([qp()], { flag: false })).join('\n'), /sans "partielBlanc": true/);
    assert.match(verifierContenu(avecPartiel([], { ecrire: false })).join('\n'), /partiel-blanc.json absent/);
});

test('partiel blanc : id partagé avec un autre fichier refusé', () => {
    const e = verifierContenu(avecPartiel([qp(), qp()])).join('\n');
    assert.match(e, /id en double/);
});
