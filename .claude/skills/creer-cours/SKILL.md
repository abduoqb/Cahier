---
name: creer-cours
description: Créer une séance de cours (cours, condensé, quiz, flashcards) dans le dossier contenu/ du projet Cahier à partir d'un support de prof et d'annales. À utiliser quand l'utilisateur demande d'ajouter, rédiger ou générer un cours, une séance, un quiz ou des cartes.
---

# Créer une séance Cahier

Lis d'abord `AGENTS.md` à la racine : il contient les règles de contenu (annales d'abord, réponses courtes, limites de longueur, annales réservées).

## Étapes

1. **Rassembler les sources** : support du prof, TD, TP, annales, aide-mémoire, fichiers de données. Demande à l'utilisateur le chemin des fichiers s'il ne les a pas donnés. Lis-les en entier avant d'écrire, puis dresse le tableau « fichier source → séance » (voir `AGENTS.md`).
2. **Créer le squelette** : `node tools/nouvelle_seance.js "<matière>" <CM|TD|TP> "<titre>"`. Note l'id de séance affiché.
3. **Lister les notions** (4 à 6 par séance, slugs à tirets) et les mettre dans `contenu/index.json`, à la place de `notion-exemple`.
4. **Rédiger** `cours.md`, puis `condense.md`, puis `quiz.json` (au moins 3 questions par notion, tirées des annales en priorité, `bonne` variée, distracteurs de même longueur), puis `cartes.json` (1 à 3 cartes par notion). Teste chaque commande dans un vrai shell avant de l'écrire.
4b. **Visuel** : pour une séance d'algorithmique, de code ou de commandes, ajouter dans `cours.md` au moins un bloc `pas-a-pas` (format et choix du schéma dans `AGENTS.md`, sections « Choisir le visuel » et « Exécution pas à pas »).
5. **Vérifier** : `node tools/check_contenu.js` doit afficher `contenu OK`. Corrige chaque erreur listée, relance jusqu'à ce que ce soit vert. Lance aussi `node --test tests/*.test.js`.
6. **Relire** : chaque question a une `source` réelle, aucune annale 2023-2024, aucune carte avec du code multi-lignes, `bonne` correspond bien à la bonne réponse, aucun avertissement de longueur ou de place de la bonne réponse.
7. **Livrer** : `git add contenu` puis commit « contenu: <matière> <séance> », puis push si l'utilisateur l'a demandé.

## Ne pas faire

- Ne pas modifier `js/`, `css/` ni `index.html`.
- Ne pas committer de `support.pdf`.
- Ne pas inventer de questions quand une annale couvre la notion.
