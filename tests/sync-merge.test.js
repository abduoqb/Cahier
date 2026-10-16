import test from 'node:test';
import assert from 'node:assert/strict';
import { aplatir, reconstruire, canon, hash } from '../js/sync-merge.js';

const donnees = {
    subjects: [{
        id: 's1', name: 'Algo',
        exams: [{ id: 'e1', name: 'Partiel', date: '2026-12-01', checklist: [{ id: 'c1', text: 'Fiches', done: false }] }],
        categories: [{ name: 'CM', items: [{ id: 'i1', title: 'CM1', done: true, fileId: 'f1' }, { id: 'i2', title: 'CM2', done: false, fileId: null }] }],
    }],
};

const fusionDe = m => new Map([...m].map(([id, e]) => [id, { ...e, u: 1, d: false }]));

test('aplatir puis reconstruire redonne les mêmes données', () => {
    const m = aplatir(donnees);
    assert.equal(m.size, 6);
    assert.equal(canon(reconstruire(fusionDe(m), {})), canon(donnees));
});

test("l'ordre des clés ne change pas la forme canonique", () => {
    assert.equal(canon({ a: 1, b: [1, { c: 2, d: 3 }] }), canon({ b: [1, { d: 3, c: 2 }], a: 1 }));
});

test('une suppression masque aussi les enfants', () => {
    const f = fusionDe(aplatir(donnees));
    f.get('s1').d = true;
    assert.deepEqual(reconstruire(f, {}).subjects, []);
});

test("l'ordre des éléments suit pos", () => {
    const f = fusionDe(aplatir(donnees));
    f.get('i1').data.pos = 5;
    const items = reconstruire(f, {}).subjects[0].categories[0].items;
    assert.deepEqual(items.map(i => i.id), ['i2', 'i1']);
});

test('renommer une catégorie change son identifiant et le parent des éléments', () => {
    const renomme = structuredClone(donnees);
    renomme.subjects[0].categories[0].name = 'Cours';
    const a = aplatir(donnees), b = aplatir(renomme);
    assert.ok(a.has('s1::CM') && !b.has('s1::CM') && b.has('s1::Cours'));
    assert.notEqual(hash(a.get('i1')), hash(b.get('i1')));
});

test('les champs inconnus et les autres clés racine sont conservés', () => {
    const d = structuredClone(donnees);
    d.subjects[0].couleur = 'rouge';
    const out = reconstruire(fusionDe(aplatir(d)), { version: 2 });
    assert.equal(out.version, 2);
    assert.equal(out.subjects[0].couleur, 'rouge');
});
