import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliser, corriger, pointsQuestion, corrigerCourte, correcteurManuel } from '../js/correction.js';

test('normaliser (texte) : casse, accents, espaces, ponctuation finale', () => {
    assert.equal(normaliser('  Là   Pile. '), 'la pile');
    assert.equal(normaliser('Élément ?!'), 'element');
    assert.equal(normaliser(undefined), '');
});

test('normaliser (commande) : trim seulement', () => {
    assert.equal(normaliser('  ls -l  ', 'commande'), 'ls -l');
    assert.equal(normaliser('ls  -l', 'commande'), 'ls  -l');
});

test('courte (texte) : réponses acceptées, normalisation', () => {
    const q = { type: 'courte', reponses: ['Dernier entré, premier sorti', 'LIFO'] };
    assert.equal(corriger(q, 'lifo.').score, 1);
    assert.equal(corriger(q, 'dernier  entre, premier sorti').score, 1);
    assert.equal(corriger(q, 'fifo').score, 0);
    assert.equal(corriger(q, '').score, 0);
});

test('courte (commande) : exacte après trim, casse et espaces comptent', () => {
    const q = { type: 'courte', mode: 'commande', reponses: ['ls -l'] };
    assert.equal(corriger(q, ' ls -l ').score, 1);
    assert.equal(corriger(q, 'ls  -l').score, 0);
    assert.equal(corriger(q, 'LS -l').score, 0);
    assert.equal(corrigerCourte(q, 42), 0);
});

test('trace : une case par variable, espaces ignorés, score partiel', () => {
    const q = { type: 'trace', attendu: { x: '3', L: '[2, 5]' } };
    assert.equal(corriger(q, { x: '3', L: '[2,5]' }).score, 1);
    assert.equal(corriger(q, { x: '3', L: '[5,2]' }).score, 0.5);
    assert.equal(corriger(q, { x: '3', L: '[5,2]' }).ok, true);
    assert.equal(corriger(q, { x: '4' }).ok, false);
});

test('ordre : score = éléments à la bonne place', () => {
    const q = { type: 'ordre', elements: ['a', 'b', 'c', 'd'] };
    assert.equal(corriger(q, ['a', 'b', 'c', 'd']).score, 1);
    assert.equal(corriger(q, ['b', 'a', 'c', 'd']).score, 0.5);
    assert.equal(corriger(q, ['d', 'c', 'b', 'a']).score, 0);
});

test('redaction : points cochés sur total du barème', () => {
    const q = { type: 'redaction', bareme: [{ critere: 'x', points: 2 }, { critere: 'y', points: 1 }, { critere: 'z', points: 1 }] };
    assert.equal(corriger(q, [true, false, true]).score, 0.75);
    assert.equal(corriger(q, [false, false, false]).ok, false);
    assert.equal(pointsQuestion(q), 4);
});

test('qcm et réponse absente', () => {
    const q = { type: 'qcm', choix: ['a', 'b'], bonne: 1 };
    assert.deepEqual(corriger(q, 1), { score: 1, ok: true });
    assert.deepEqual(corriger(q, 0), { score: 0, ok: false });
    assert.deepEqual(corriger(q, undefined), { score: 0, ok: false });
    assert.equal(pointsQuestion({ ...q, points: 3 }), 3);
    assert.equal(pointsQuestion(q), 1);
});

test('correcteur manuel : aucun critère coché d\'avance', async () => {
    const r = await correcteurManuel({ bareme: [{ points: 1 }, { points: 2 }] }, 'texte');
    assert.deepEqual(r.coches, [false, false]);
});
