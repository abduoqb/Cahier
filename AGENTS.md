# Cahier — consignes pour les agents

Site de révision (HTML/CSS/JS sans framework, hébergé sur Vercel, synchro Supabase). Les cours vivent dans `contenu/` sous forme de fichiers ; un agent peut en créer sans toucher au code du site. Le site n'a pas de build : un cours apparaît après `git push` et redéploiement Vercel.

## Créer une séance

1. Lire le support du prof et les annales fournis par l'utilisateur. Ne jamais lire ni envoyer ses notes papier.
2. Créer le dossier : `node tools/nouvelle_seance.js "<matière>" <CM|TD|TP> "<titre>"` (option `--cartes=non`). Une matière inconnue est créée. Son nom doit être identique, à la casse et aux accents près, à celui de la matière dans le site, car le site relie les deux par `slug(nom) === id`.
3. Remplacer le contenu des fichiers générés dans `contenu/<matière>/<séance>/` :
   - `cours.md` : le cours complet. Sections « À savoir faire », « L'essentiel », « Pièges fréquents ».
   - `condense.md` : la version à relire la veille d'un examen (tableaux, une ligne par notion).
   - `quiz.json` : questions QCM.
   - `cartes.json` : flashcards.
   - `img/` : SVG ou PNG, référencés dans le markdown par `![texte](img/nom.svg)`.
4. Dans `contenu/index.json`, remplacer `"notions": ["notion-exemple"]` par la liste des notions de la séance (slugs en minuscules avec tirets). Chaque question et chaque carte porte exactement une de ces notions ; chaque notion doit avoir au moins une question.
5. Lancer `node tools/check_contenu.js`. Il doit afficher `contenu OK` (les avertissements sur `support.pdf` sont normaux). Lancer aussi `node --test tests/*.test.js`.
6. Committer uniquement `contenu/`, puis pousser.

## Règles de contenu

- **Annales d'abord** : prendre le maximum de questions, énoncés et exercices dans les annales et le support du prof. N'inventer que si rien ne couvre la notion. Chaque question et carte cite sa `source` (ex. « Annale 2022-2023, exercice 2 »).
- **Annales 2023-2024 réservées** aux tests blancs : jamais dans le contenu (le vérificateur refuse toute mention).
- **Réponses courtes** : une idée par carte. Recto 200 caractères max, verso 120 max et sur une seule ligne. Énoncé de question 400 max, choix 120 max, 2 à 5 choix.
- **Pas de code sur les cartes**, même court.
- **Contextualiser les fonctions** : une question qui nomme une fonction (`mystere`, `partition`…) dit en une phrase ce qu'elle fait, sans montrer son code. La phrase vient de l'annale ou du TD.
- **Identifiants** : questions `q-<id-séance>-001`, cartes `c-<id-séance>-001`, uniques dans tout le projet. `quiz.seance` et `cartes.seance` valent l'id de la séance.
- `bonne` est l'index (à partir de 0) de la bonne réponse dans `choix` ; le site mélange l'ordre à l'affichage.
- Interdits dans les `.md` : liens `[[wikilink]]` et callouts Obsidian (`> [!note]`). Le markdown est rendu par `marked`.
- Français, ton direct et simple.

## Fichiers à ne pas versionner

- `support.pdf` des profs (droits d'auteur) : ignoré par git, les mettre à côté de la séance pour qu'ils s'affichent en local. `fiche.pdf` (fiche de révision de l'utilisateur) est versionnable.
- `tools/snapshots/`, `.env`, tout ce qui vient d'eCampus.

## Le reste du projet

- `js/` : le site (routeur `app.js`, stockage local `store.js`, synchro `sync.js`, quiz, cartes). Ne pas le modifier pour ajouter un cours.
- `tests/` : `node --test tests/*.test.js`.
- `extension/` et `tools/ecampus_snapshot.py` : chantier eCampus séparé.
- Les fichiers du dépôt sont en CRLF : conserver les fins de ligne en modifiant du code.
- En modifiant un module JS, incrémenter son `?v=` dans les imports qui le chargent (cache navigateur).
