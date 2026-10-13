import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgress, INTERVALLES } from '../js/progress.js';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 14, 10, 0, 0);
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const q = { notion: 'listes-parcours' };

test('notion jamais vue', () => {
    const p = createProgress(mem());
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0).etat, 'pas-commencee');
});

test('une réussite : en cours ; même jour : toujours en cours', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, true, T0 + 3600 * 1000);
    p.recordAnswer('cm2', q, true, T0);
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0 + 7200 * 1000).etat, 'en-cours');
});

test('deux réussites espacées d\'un jour : acquise', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, true, T0 + DAY);
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0 + DAY).etat, 'acquise');
});

test('un échec remet le compteur à zéro', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, false, T0 + 1000);
    p.recordAnswer('cm2', q, true, T0 + DAY);
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0 + DAY).etat, 'en-cours');
});

test('acquise puis à revoir après 3 jours', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, true, T0 + DAY);
    const t = T0 + DAY;
    assert.equal(p.getNotion('cm2', 'listes-parcours', t + 2 * DAY).etat, 'acquise');
    assert.equal(p.getNotion('cm2', 'listes-parcours', t + INTERVALLES[0]).etat, 'a-revoir');
});

test('réussite quand à revoir : palier suivant (7 jours)', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, true, T0 + DAY);
    const t = T0 + DAY + INTERVALLES[0];
    p.recordAnswer('cm2', q, true, t);
    assert.equal(p.getNotion('cm2', 'listes-parcours', t + 6 * DAY).etat, 'acquise');
    assert.equal(p.getNotion('cm2', 'listes-parcours', t + INTERVALLES[1]).etat, 'a-revoir');
});

test('échec sur une notion acquise : à revoir tout de suite, puis acquise après réussite', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', q, true, T0);
    p.recordAnswer('cm2', q, true, T0 + DAY);
    p.recordAnswer('cm2', q, false, T0 + DAY + 1000);
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0 + DAY + 2000).etat, 'a-revoir');
    p.recordAnswer('cm2', q, true, T0 + DAY + 3000);
    assert.equal(p.getNotion('cm2', 'listes-parcours', T0 + DAY + 4000).etat, 'acquise');
});

test('notionsDues : à revoir avant en cours', () => {
    const p = createProgress(mem());
    p.recordAnswer('cm2', { notion: 'a' }, true, T0);
    p.recordAnswer('cm2', { notion: 'b' }, true, T0);
    p.recordAnswer('cm2', { notion: 'b' }, true, T0 + DAY);
    const dues = p.notionsDues(T0 + DAY + INTERVALLES[0]);
    assert.deepEqual(dues.map(d => [d.notion, d.etat]), [['b', 'a-revoir'], ['a', 'en-cours']]);
});

test('etatSeance', () => {
    const p = createProgress(mem());
    assert.equal(p.etatSeance('cm2', ['a', 'b'], T0), 'pas-commencee');
    p.recordAnswer('cm2', { notion: 'a' }, true, T0);
    assert.equal(p.etatSeance('cm2', ['a', 'b'], T0), 'en-cours');
    for (const n of ['a', 'b']) { p.recordAnswer('cm2', { notion: n }, true, T0); p.recordAnswer('cm2', { notion: n }, true, T0 + DAY); }
    assert.equal(p.etatSeance('cm2', ['a', 'b'], T0 + DAY), 'acquise');
    assert.equal(p.etatSeance('cm2', ['a', 'b'], T0 + DAY + INTERVALLES[0]), 'a-revoir');
});

test('stockage corrompu ou en erreur : état vide, pas d\'exception', () => {
    const bad = { getItem: () => '{pas du json', setItem: () => { throw new Error('quota'); } };
    const p = createProgress(bad);
    assert.equal(p.getNotion('cm2', 'x', T0).etat, 'pas-commencee');
    assert.doesNotThrow(() => p.recordAnswer('cm2', { notion: 'x' }, true, T0));
    assert.deepEqual(p.notionsDues(T0), []);
});
