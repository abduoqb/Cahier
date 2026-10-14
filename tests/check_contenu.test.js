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
