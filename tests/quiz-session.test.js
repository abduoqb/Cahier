import test from 'node:test';
import assert from 'node:assert/strict';
import { melanger, preparerQuestion, construireSession, choisirDuJour } from '../js/quiz-session.js';

const q = (id, notion, source = 'TD1 ex. 1') => ({ id, notion, enonce: id, choix: ['A', 'B', 'C', 'D'], bonne: 2, explication: 'x', source });

test('melanger garde les mêmes éléments sans modifier l\'original', () => {
    const src = [1, 2, 3, 4, 5];
    const out = melanger(src, () => 0.3);
    assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
    assert.deepEqual(src, [1, 2, 3, 4, 5]);
});

test('preparerQuestion : la bonne réponse suit le mélange', () => {
    for (const r of [0, 0.2, 0.5, 0.99]) {
        const p = preparerQuestion(q('a', 'n'), () => r);
        assert.equal(p.choix[p.bonne], 'C');
        assert.deepEqual([...p.choix].sort(), ['A', 'B', 'C', 'D']);
    }
});

test('construireSession respecte max et conserve seanceId', () => {
    const qs = Array.from({ length: 12 }, (_, i) => ({ ...q('q' + i, 'n'), seanceId: 'cm1' }));
    const s = construireSession(qs, { max: 5, rng: () => 0.4 });
    assert.equal(s.length, 5);
    assert.ok(s.every(x => x.seanceId === 'cm1'));
});

test('choisirDuJour : prend les questions des notions dues', () => {
    const quizzes = { cm1: { questions: [q('a', 'n1'), q('b', 'n2')] }, cm2: { questions: [q('c', 'n1')] } };
    const r = choisirDuJour([{ seanceId: 'cm1', notion: 'n1', etat: 'a-revoir' }], quizzes, { rng: () => 0.5 });
    assert.equal(r.mode, 'revision');
    assert.deepEqual(r.questions.map(x => x.id), ['a']);
    assert.equal(r.questions[0].seanceId, 'cm1');
});

test('choisirDuJour : sans dues, repli sur les questions d\'annale', () => {
    const quizzes = { cm1: { questions: [q('a', 'n1', 'annale 2024-2025 ex. 2 Q1'), q('b', 'n2', 'TD1 ex. 1')] } };
    const r = choisirDuJour([], quizzes, { rng: () => 0.5 });
    assert.equal(r.mode, 'annales');
    assert.deepEqual(r.questions.map(x => x.id), ['a']);
});

test('choisirDuJour : rien du tout → vide', () => {
    const r = choisirDuJour([], { cm1: { questions: [q('b', 'n2', 'TD1 ex. 1')] } });
    assert.deepEqual(r, { mode: 'vide', questions: [] });
    assert.deepEqual(choisirDuJour([], {}), { mode: 'vide', questions: [] });
});
