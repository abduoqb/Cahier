import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartes, BOITES, NOUVELLES_PAR_JOUR, jourLocal, rassemblerCartes } from '../js/cartes-etat.js';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 14, 10, 0, 0).getTime(); // 14 octobre 2026, 10 h, heure locale
const mem = (init = null) => {
    const m = new Map();
    if (init !== null) m.set('cahier.cartes.v1', init);
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};
const ids = n => Array.from({ length: n }, (_, i) => `n${i + 1}`);

test('constantes', () => {
    assert.deepEqual(BOITES, [1, 3, 7, 14, 30]);
    assert.equal(NOUVELLES_PAR_JOUR, 10);
});

test('jourLocal', () => {
    assert.equal(jourLocal(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05');
    assert.equal(jourLocal(new Date(2026, 9, 15, 0, 1).getTime()), '2026-10-15');
});

test('carte jamais notée : null', () => {
    assert.equal(createCartes(mem()).getCarte('a'), null);
});

test('nouvelle carte sue : boîte 2, revient dans 3 jours', () => {
    const c = createCartes(mem());
    c.noter('a', true, T0);
    assert.deepEqual(c.getCarte('a'), { boite: 2, prochaine: T0 + 3 * DAY, vue: T0 });
});

test('nouvelle carte ratée : boîte 1, revient demain', () => {
    const c = createCartes(mem());
    c.noter('a', false, T0);
    assert.deepEqual(c.getCarte('a'), { boite: 1, prochaine: T0 + DAY, vue: T0 });
});

test('je savais fait monter, plafond en boîte 5', () => {
    const c = createCartes(mem());
    for (let k = 0; k < 6; k++) c.noter('a', true, T0);
    assert.deepEqual(c.getCarte('a'), { boite: 5, prochaine: T0 + 30 * DAY, vue: T0 });
});

test('je ne savais pas renvoie en boîte 1', () => {
    const c = createCartes(mem());
    c.noter('a', true, T0);
    c.noter('a', true, T0);
    c.noter('a', false, T0 + DAY);
    assert.deepEqual(c.getCarte('a'), { boite: 1, prochaine: T0 + 2 * DAY, vue: T0 + DAY });
});

test('cartesDues : seulement les échues, les plus en retard d\'abord', () => {
    const c = createCartes(mem());
    c.noter('a', true, T0);               // due à T0 + 3 j
    c.noter('b', false, T0);              // due à T0 + 1 j
    for (let k = 0; k < 3; k++) c.noter('c', true, T0); // boîte 4 : T0 + 14 j
    assert.deepEqual(c.cartesDues(['a', 'b', 'c', 'z'], T0 + 4 * DAY), ['b', 'a']);
    assert.deepEqual(c.cartesDues(['a', 'b', 'c'], T0), []);
});

test('nouvellesDuJour : ordre conservé, limite', () => {
    const c = createCartes(mem());
    assert.deepEqual(c.nouvellesDuJour(ids(12), T0), ids(10));
    assert.deepEqual(c.nouvellesDuJour(ids(12), T0, 3), ['n1', 'n2', 'n3']);
});

test('quota : les nouvelles notées aujourd\'hui réduisent le reste', () => {
    const c = createCartes(mem());
    c.noter('n1', true, T0);
    c.noter('n2', false, T0);
    const r = c.nouvellesDuJour(ids(20), T0 + 3600 * 1000);
    assert.equal(r.length, 8);
    assert.equal(r[0], 'n3');
});

test('quota : revoir une carte déjà vue ne consomme pas de quota', () => {
    const c = createCartes(mem());
    c.noter('n1', false, T0);
    c.noter('n1', true, T0);
    c.noter('n1', true, T0);
    assert.equal(c.nouvellesDuJour(ids(20), T0).length, 9);
});

test('quota : remis à zéro le lendemain (jour local)', () => {
    const c = createCartes(mem());
    for (const id of ids(10)) c.noter(id, true, T0);
    assert.deepEqual(c.nouvellesDuJour(ids(20), T0 + 3600 * 1000), []);
    const lendemain = new Date(2026, 9, 15, 0, 30).getTime();
    assert.deepEqual(c.nouvellesDuJour(ids(20), lendemain), ids(20).slice(10, 20));
});

test('stockage illisible : repart de zéro et reste utilisable', () => {
    const c = createCartes(mem('pas du json'));
    assert.equal(c.getCarte('a'), null);
    c.noter('a', true, T0);
    assert.equal(c.getCarte('a').boite, 2);
});

test('enregistrements mal formés ignorés', () => {
    const brut = JSON.stringify({
        cartes: { a: { boite: 9, prochaine: 1, vue: 1 }, b: { boite: 2, prochaine: 5, vue: 1 }, c: 'x', d: { boite: 1, prochaine: '5', vue: 1 } },
        nouvelles: 'x',
    });
    const c = createCartes(mem(brut));
    assert.equal(c.getCarte('a'), null);
    assert.deepEqual(c.getCarte('b'), { boite: 2, prochaine: 5, vue: 1 });
    assert.equal(c.getCarte('c'), null);
    assert.equal(c.getCarte('d'), null);
    assert.equal(c.nouvellesDuJour(ids(20), T0).length, 10);
});

test('sessionDuJour renvoie des objets carte', () => {
    const c = createCartes(mem());
    const cartes = [{ id: 'x1', recto: 'r1' }, { id: 'x2', recto: 'r2' }, { id: 'x3', recto: 'r3' }];
    c.noter('x2', false, T0);
    const s = c.sessionDuJour(cartes, T0 + 2 * DAY, 1);
    assert.deepEqual(s.dues, [{ id: 'x2', recto: 'r2' }]);
    assert.deepEqual(s.nouvelles, [{ id: 'x1', recto: 'r1' }]);
});

test('rassemblerCartes : séances sans drapeau sautées, fichiers illisibles comptés', async () => {
    const index = { matieres: [{ id: 'm', seances: [
        { id: 's1', type: 'CM', titre: 'Un', dossier: 'm/s1', cartes: true },
        { id: 's2', type: 'CM', titre: 'Deux', dossier: 'm/s2' },
        { id: 's3', type: 'CM', titre: 'Trois', dossier: 'm/s3', cartes: true },
        { id: 's4', type: 'TD', titre: 'Quatre', dossier: 'm/s4', cartes: true },
    ] }] };
    const vus = [];
    const charger = async dossier => {
        vus.push(dossier);
        if (dossier === 'm/s3') throw new Error('Fichier introuvable');
        if (dossier === 'm/s4') return { seance: 's4', cartes: 'pas un tableau' };
        return { seance: 's1', cartes: [{ id: 'c-s1-001', notion: 'n', recto: 'r', verso: 'v', source: 's' }] };
    };
    const r = await rassemblerCartes(index, charger);
    assert.deepEqual(vus, ['m/s1', 'm/s3', 'm/s4']);
    assert.equal(r.erreurs, 2);
    assert.deepEqual(r.cartes, [{ id: 'c-s1-001', notion: 'n', recto: 'r', verso: 'v', source: 's', seanceId: 's1', seanceTitre: 'CM · Un' }]);
});
