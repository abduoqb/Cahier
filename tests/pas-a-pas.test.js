import test from 'node:test';
import assert from 'node:assert/strict';
import { validerPasAPas } from '../js/pas-a-pas.js';

const liste = { type: 'liste', noeuds: [{ v: '7', suivant: 1 }, { v: '9', suivant: null }], pointeurs: { L: 0, p: null } };
const valide = () => ({
    titre: 'Essai',
    code: ['a = 1', 'b = 2'],
    etapes: [
        { ligne: 0, vars: { a: 1 }, note: 'Début.', schema: liste },
        { ligne: 1, vars: { b: '2' }, schema: { type: 'tableau', cases: [1, 2, 3], marques: { i: 2 }, surligne: [0], fixes: [1] } },
        { ligne: null, note: 'État final.' },
    ],
});

test('définition valide : aucune erreur', () => {
    assert.deepEqual(validerPasAPas(valide()), []);
});

test('pas un objet, ou code/étapes absents', () => {
    assert.equal(validerPasAPas([]).length, 1);
    assert.equal(validerPasAPas({ code: ['a'], etapes: [] }).length, 1);
    assert.ok(validerPasAPas({ etapes: [{ ligne: 0 }] }).some(m => m.startsWith('code')));
});

test('ligne hors du code', () => {
    const d = valide();
    d.etapes[1].ligne = 2;
    assert.ok(validerPasAPas(d).some(m => m.includes('étape 2') && m.includes('ligne')));
});

test('liste : suivant hors bornes, vers soi-même, pointeur invalide', () => {
    for (const modif of [
        s => { s.noeuds[0].suivant = 5; },
        s => { s.noeuds[0].suivant = 0; },
        s => { s.pointeurs.L = 9; },
        s => { s.noeuds[1].v = null; },
    ]) {
        const d = valide();
        d.etapes[0].schema = JSON.parse(JSON.stringify(liste));
        modif(d.etapes[0].schema);
        assert.ok(validerPasAPas(d).length > 0);
    }
});

test('tableau : marque ou surlignage hors bornes', () => {
    const d = valide();
    d.etapes[1].schema.marques.i = 3;
    assert.equal(validerPasAPas(d).length, 1);
    d.etapes[1].schema.marques.i = 0;
    d.etapes[1].schema.fixes = [7];
    assert.equal(validerPasAPas(d).length, 1);
});

test('type de schéma inconnu, vars non textuelles, note trop longue', () => {
    const d = valide();
    d.etapes[0].schema = { type: 'graphe' };
    d.etapes[1].vars = { b: { x: 1 } };
    d.etapes[2].note = 'x'.repeat(300);
    assert.equal(validerPasAPas(d).length, 3);
});

const arbre = () => ({ type: 'arbre', noeuds: [{ v: '7', g: 1, d: 2 }, { v: '4' }, { v: '2' }], pointeurs: { A: 0 }, visites: [1], courant: 0 });
const avecSchema = s => ({ code: ['a'], etapes: [{ ligne: 0, schema: s }] });

test('arbre valide', () => {
    assert.deepEqual(validerPasAPas(avecSchema(arbre())), []);
});

test('arbre : fils hors bornes, cycle, noeud à deux parents, courant invalide', () => {
    for (const modif of [
        s => { s.noeuds[1].g = 9; },
        s => { s.noeuds[1].g = 0; },
        s => { s.noeuds[1].d = 2; },
        s => { s.courant = 5; },
        s => { s.pointeurs.A = 7; },
        s => { s.visites = [-1]; },
    ]) {
        const s = arbre();
        modif(s);
        assert.ok(validerPasAPas(avecSchema(s)).length > 0);
    }
});

test('arbre à plusieurs enfants (fils) : valide, puis erreurs', () => {
    const ok = { type: 'arbre', noeuds: [{ v: 'A', fils: [1, 2, 3] }, { v: 'B' }, { v: 'C' }, { v: 'D' }] };
    assert.deepEqual(validerPasAPas(avecSchema(ok)), []);
    for (const modif of [
        s => { s.noeuds[0].fils = [9]; },
        s => { s.noeuds[0].fils = [0]; },
        s => { s.noeuds[0].fils = 'x'; },
        s => { s.noeuds[1].fils = [0]; },
        s => { s.noeuds[1].fils = [2]; },
    ]) {
        const s = JSON.parse(JSON.stringify(ok));
        modif(s);
        assert.ok(validerPasAPas(avecSchema(s)).length > 0);
    }
});

test('tube : valide, puis erreurs', () => {
    const ok = { type: 'tube', gauche: { nom: 'Père', lecture: 'ouvert', ecriture: 'ferme' }, droite: { nom: 'Fils', lecture: 'ferme', ecriture: 'ouvert' }, tampon: 'bonjour' };
    assert.deepEqual(validerPasAPas(avecSchema(ok)), []);
    assert.deepEqual(validerPasAPas(avecSchema({ type: 'tube', gauche: ok.gauche })), []);
    for (const modif of [
        s => { delete s.gauche; },
        s => { s.gauche.lecture = 'peut-être'; },
        s => { s.droite.nom = ''; },
        s => { s.tampon = 'x'.repeat(30); },
    ]) {
        const s = JSON.parse(JSON.stringify(ok));
        modif(s);
        assert.ok(validerPasAPas(avecSchema(s)).length > 0);
    }
});
