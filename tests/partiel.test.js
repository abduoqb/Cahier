import test from 'node:test';
import assert from 'node:assert/strict';
import { construireSujet, sujetsDe, tempsRestant, formatDuree, noterPartiel, notionsRatees, creerEnregistrement, fusionnerPartiels, createPartiels } from '../js/partiel.js';

const qcm = (id, extra = {}) => ({ id, type: 'qcm', seance: 's1', notion: 'n1', choix: ['a', 'b', 'c'], bonne: 0, ...extra });
const rngFixe = () => 0.3;

test('sujetsDe et construireSujet : un sujet garde l\'ordre du fichier', () => {
    const qs = [qcm('p1', { sujet: 'S1' }), qcm('p2', { sujet: 'S2' }), qcm('p3', { sujet: 'S1' })];
    assert.deepEqual(sujetsDe(qs), ['S1', 'S2']);
    assert.deepEqual(construireSujet(qs, { sujet: 'S1' }).map(q => q.id), ['p1', 'p3']);
    assert.equal(construireSujet(qs, { rng: rngFixe }).length, 3);
});

test('construireSujet : le bon ordre n\'est jamais proposé tel quel', () => {
    const o = { id: 'p9', type: 'ordre', seance: 's1', notion: 'n1', elements: ['1', '2', '3'] };
    const [q] = construireSujet([o], { rng: () => 0.99 });
    assert.notDeepEqual(q.depart, q.elements);
    assert.deepEqual([...q.depart].sort(), ['1', '2', '3']);
});

test('tempsRestant et formatDuree', () => {
    assert.equal(tempsRestant(1000, 1, 1000), 60);
    assert.equal(tempsRestant(1000, 1, 31000), 30);
    assert.equal(tempsRestant(1000, 1, 999999), 0);
    assert.equal(formatDuree(65), '01:05');
    assert.equal(formatDuree(3725), '1:02:05');
});

const sujet = [
    qcm('p1', { points: 2 }),
    qcm('p2', { points: 1, notion: 'n2' }),
    { id: 'p3', type: 'redaction', seance: 's2', notion: 'n3', bareme: [{ critere: 'a', points: 3 }, { critere: 'b', points: 1 }] },
    { id: 'p4', type: 'courte', seance: 's2', notion: 'n3', reponses: ['x'] },
];

test('noterPartiel : barème inégal, note sur 20, question sans réponse = 0', () => {
    const r = noterPartiel(sujet, { p1: 0, p2: 1, p3: [true, false] });
    assert.equal(r.max, 8);
    assert.equal(r.points, 5); // 2 + 0 + 3 + 0
    assert.equal(r.note20, 12.5);
    assert.equal(r.parQuestion.find(q => q.id === 'p4').points, 0);
});

test('noterPartiel : tout juste = 20, rien = 0, arrondi au quart de point', () => {
    assert.equal(noterPartiel(sujet, { p1: 0, p2: 0, p3: [true, true], p4: 'X' }).note20, 20);
    assert.equal(noterPartiel(sujet, {}).note20, 0);
    assert.equal(noterPartiel([qcm('a'), qcm('b'), qcm('c')], { a: 0 }).note20, 6.75); // 20/3 = 6,67
    assert.equal(noterPartiel([], {}).note20, 0);
});

test('noterPartiel : détail par notion et notions ratées', () => {
    const r = noterPartiel(sujet, { p1: 0, p2: 1, p3: [true, true] });
    assert.deepEqual(r.parNotion['s1/n1'], { points: 2, max: 2 });
    assert.deepEqual(r.parNotion['s2/n3'], { points: 4, max: 5 });
    assert.deepEqual(notionsRatees(r.parNotion), [{ seanceId: 's1', notion: 'n2' }]);
});

test('notionsRatees : seuil exclusif, notion de séance avec tirets', () => {
    const pn = { 'cm1-x/a-b': { points: 1, max: 2 }, 'cm1-x/c': { points: 0.9, max: 2 }, 'cm1-x/d': { points: 0, max: 0 } };
    assert.deepEqual(notionsRatees(pn), [{ seanceId: 'cm1-x', notion: 'c' }]);
    assert.deepEqual(notionsRatees(pn, 0.4), []);
});

test('creerEnregistrement : ligne d\'historique sans les réponses', () => {
    const res = noterPartiel(sujet, { p1: 0 });
    const rec = creerEnregistrement({ id: 'x', matiere: 'algo', sujet: 'S1', date: 5, dureeS: 90.4, resultat: res });
    assert.equal(rec.note, res.note20);
    assert.equal(rec.duree_s, 90);
    assert.equal(rec.detail.sujet, 'S1');
    assert.equal(rec.detail.parQuestion.length, 4);
    assert.equal(rec.u, 5);
    assert.equal(rec.d, false);
    assert.equal(JSON.stringify(rec).includes('reponse'), false);
});

test('fusionnerPartiels : le plus récent gagne, suppression comprise', () => {
    const a = { id: 'a', u: 10, d: false }, a2 = { id: 'a', u: 20, d: true };
    const b = { id: 'b', u: 5, d: false }, c = { id: 'c', u: 7, d: false };
    const { fusion, aEnvoyer } = fusionnerPartiels({ a, b }, { a: a2, b: { ...b, u: 5 }, c });
    assert.equal(fusion.a.d, true);
    assert.equal(fusion.c, c);
    assert.deepEqual(aEnvoyer, []);
    const r2 = fusionnerPartiels({ a: a2, n: { id: 'n', u: 1, d: false } }, { a });
    assert.deepEqual(r2.aEnvoyer.sort(), ['a', 'n']);
});

const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

test('stockage : historique par matière, suppression logique, brouillon local', () => {
    const p = createPartiels(mem());
    p.ajouter({ id: '1', matiere: 'algo', date: 1, u: 1, d: false });
    p.ajouter({ id: '2', matiere: 'algo', date: 2, u: 2, d: false });
    p.ajouter({ id: '3', matiere: 'bdd', date: 3, u: 3, d: false });
    assert.deepEqual(p.lister('algo').map(r => r.id), ['2', '1']);
    p.supprimer('2', 99);
    assert.deepEqual(p.lister('algo').map(r => r.id), ['1']);
    assert.deepEqual(p.tous()['2'], { id: '2', matiere: 'algo', date: 2, u: 99, d: true });
    assert.equal(p.brouillon(), null);
    p.sauverBrouillon({ matiere: 'algo' });
    assert.deepEqual(p.brouillon(), { matiere: 'algo' });
    p.effacerBrouillon();
    assert.equal(p.brouillon(), null);
});
