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
