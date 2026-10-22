// Crée une séance à partir de contenu/_modele et la déclare dans contenu/index.json.
// Usage : node tools/nouvelle_seance.js <matière> <CM|TD|TP> "<titre>" [--cartes=non]
// <matière> : id existant (ex. algorithmique-1) ou nom (ex. "Algorithmique 1") ; une matière inconnue est créée.
import fs from 'node:fs';
import path from 'node:path';

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const args = process.argv.slice(2);
const sansCartes = args.includes('--cartes=non');
const [matiereArg, typeArg, titre] = args.filter(a => !a.startsWith('--'));
const TYPES = ['CM', 'TD', 'TP'];
const type = (typeArg || '').toUpperCase();
if (!matiereArg || !TYPES.includes(type) || !titre) {
    console.error('Usage : node tools/nouvelle_seance.js <matière> <CM|TD|TP> "<titre>" [--cartes=non]');
    process.exit(1);
}

const racine = 'contenu';
const fichierIndex = path.join(racine, 'index.json');
const index = JSON.parse(fs.readFileSync(fichierIndex, 'utf8'));
let matiere = index.matieres.find(m => m.id === slug(matiereArg));
if (!matiere) {
    matiere = { id: slug(matiereArg), nom: matiereArg, seances: [] };
    index.matieres.push(matiere);
    console.log(`Matière créée : ${matiere.nom} (id ${matiere.id}). Son nom doit être identique à celui de la matière dans le site.`);
}

const numero = matiere.seances.filter(s => s.type === type).length + 1;
const id = `${type.toLowerCase()}${numero}-${slug(titre)}`;
const dossier = `${matiere.id}/${id}`;
const cible = path.join(racine, dossier);
if (fs.existsSync(cible)) { console.error(`Existe déjà : ${cible}`); process.exit(1); }

fs.mkdirSync(path.join(cible, 'img'), { recursive: true });
const remplacer = t => t.replaceAll('{{ID}}', id).replaceAll('{{TYPE}}', type).replaceAll('{{TITRE}}', titre);
const fichiers = ['cours.md', 'condense.md', 'quiz.json', ...(sansCartes ? [] : ['cartes.json'])];
for (const f of fichiers) {
    fs.writeFileSync(path.join(cible, f), remplacer(fs.readFileSync(path.join(racine, '_modele', f), 'utf8')));
}

const seance = { id, type, titre, dossier };
if (!sansCartes) seance.cartes = true;
seance.notions = ['notion-exemple'];
matiere.seances.push(seance);
fs.writeFileSync(fichierIndex, JSON.stringify(index, null, 2) + '\n');
console.log(`Séance créée : ${cible}\nRemplace les fichiers du dossier, mets à jour "notions" dans contenu/index.json, puis lance : node tools/check_contenu.js`);
