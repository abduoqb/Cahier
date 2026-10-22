# Cahier — consignes pour les agents

Site de révision (HTML/CSS/JS sans framework, hébergé sur Vercel, synchro Supabase). Les cours vivent dans `contenu/` sous forme de fichiers ; un agent peut en créer sans toucher au code du site. Le site n'a pas de build : un cours apparaît après `git push` et redéploiement Vercel.

## Créer une séance

1. Lire **tous** les fichiers fournis (supports, annales, TP, aide-mémoire, fichiers de données) et les ranger dans un tableau « fichier source → séance », dans la réponse finale. Terminer par la liste de ce qui n'a pas été utilisé, avec la raison. Ne jamais lire ni envoyer les notes papier de l'utilisateur.
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
- **Code sur les cartes** : pas de code multi-lignes. Pour les matières shell et programmation, une commande ou une expression courte sur une seule ligne est autorisée (c'est la notion à retenir) ; sinon une carte décrit en mots.
- **Tester avant d'écrire** : toute commande, regex ou script du contenu est exécuté dans un vrai shell sur des fichiers d'essai (Git Bash suffit, `athlete_events.csv` et les autres fichiers de données fournis servent à ça). Une commande non testée ne va pas dans le cours.
- **Le support peut se tromper** : quand le prof a une coquille ou une erreur (`echo {a-d}` au lieu de `{a..d}`, « lignes 2 et 4 » pour `2,5d`), corriger dans le contenu et le signaler dans la réponse finale, sans recopier l'erreur.
- **Contextualiser les fonctions** : une question qui nomme une fonction (`mystere`, `partition`…) dit en une phrase ce qu'elle fait, sans montrer son code. La phrase vient de l'annale ou du TD.
- **Identifiants** : questions `q-<id-séance>-001`, cartes `c-<id-séance>-001`, uniques dans tout le projet. `quiz.seance` et `cartes.seance` valent l'id de la séance.
- `bonne` est l'index (à partir de 0) de la bonne réponse dans `choix` ; le site mélange l'ordre à l'affichage, mais on varie quand même `bonne` d'une question à l'autre.
- **QCM qui ne se devinent pas** : la bonne réponse n'est pas systématiquement la plus longue (le vérificateur avertit au-delà de 50 %) ; les distracteurs ont la même forme et la même longueur que la bonne réponse, et sont des erreurs réelles d'étudiants, jamais des phrases absurdes. Pas de question dont un distracteur est en fait correct (vérifier avec une exécution réelle).
- **Au moins 3 questions par notion**, dont une question « que produit cette commande ? » ou « que se passe-t-il ? » sur un cas concret, pas seulement des définitions.
- **Syntaxe shell** : les doubles crochets de bash (`[[ -n $x ]]`) sont autorisés dans les blocs et extraits de code ; le vérificateur ne refuse les wikilinks que dans le texte. Un cours doit utiliser la même syntaxe dans le cours, les cartes et les QCM.
- **TP** : un TP (ou un groupe cohérent de TP) = une séance. Traiter chaque question numérotée du sujet, ou dire dans la note d'en-tête lesquelles sont omises. Un sujet sans corrigé officiel donne des « propositions de correction », testées, présentées comme telles.
- Interdits dans les `.md` : liens `[[wikilink]]` et callouts Obsidian (`> [!note]`). Le markdown est rendu par `marked`.
- Français, ton direct et simple.

## Choisir le visuel

Chaque séance de code, de commandes ou de structures contient au moins un bloc `pas-a-pas` ou un SVG dans `img/`. Quel schéma pour quelle notion :

| Notion | Visuel |
|---|---|
| flux, descripteurs, redirections (`>`, `2>&1`, `dup2`) | `tableau` : une case par descripteur |
| tube, `cmd1 \| cmd2`, `pipe` | `tube` |
| droits `rwx`, `umask`, bits | `tableau` : une case par bit ou par catégorie |
| processus créés par `fork` | `arbre` à plusieurs enfants |
| listes, piles, files, arbres | `liste`, `tableau`, `arbre` |
| commande qui transforme un texte (`sed`, `awk`, `grep`) | `pas-a-pas` sans schéma : les variables montrent le texte ligne par ligne |
| arguments, boucles, variables d'un script | `pas-a-pas` avec `vars` |
| arborescence de répertoires, schéma d'architecture | SVG à la main dans `img/` |

## Exécution pas à pas (dans `cours.md`)

Pour tracer un algorithme (listes chaînées, tableaux, tris, parcours), mettre dans `cours.md` un bloc de code de langage `pas-a-pas` contenant du JSON. Le site l'affiche avec le code, la ligne courante, les variables et un schéma, et des boutons Précédent / Suivant. Exemples réels : `contenu/algorithmique-1/cm2-listes-chainees/cours.md` (liste) et `cm1-tableaux/cours.md` (tableau). Ne jamais écrire de HTML ni de JavaScript : seulement des données.

- `titre` (texte), `code` (tableau de lignes, indentation comprise, 30 max), `etapes` (60 max).
- Chaque étape : `ligne` (indice dans `code`, à partir de 0, ou `null`), `note` (240 caractères max), `vars` (variables qui changent à cette étape ; elles s'ajoutent aux précédentes), `schema` (facultatif : s'il manque, le schéma précédent reste).
- Schéma `liste` : `{"type":"liste","noeuds":[{"v":"7","suivant":1},{"v":"9","suivant":null}],"pointeurs":{"L":0,"p":null}}`. Les nœuds sont dessinés dans l'ordre du tableau (de gauche à droite) ; `suivant` est l'indice du nœud suivant ou `null` ; chaque pointeur désigne un indice, ou `null` pour None. Un nœud non relié reste affiché (utile pour `Nouveau`).
- Schéma `tableau` : `{"type":"tableau","cases":[4,9,2,7],"marques":{"i":1},"surligne":[0,1],"fixes":[1]}`. `marques` place un nom sous une case, `surligne` colore les cases comparées, `fixes` colore celles qui sont définitives.
- Schéma `arbre` (arbre binaire) : `{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":null,"d":null},{"v":"2","g":null,"d":null}],"racine":0,"pointeurs":{"A":0},"visites":[1],"courant":0}`. `g` et `d` sont les indices des fils gauche et droit (ou `null`) ; la disposition est calculée toute seule. `visites` colore en vert les nœuds déjà traités, `courant` en ocre le nœud en cours, `pointeurs` ajoute une pastille à côté d'un nœud.
- Arbre à plusieurs enfants (arbre des processus d'un `fork`) : au lieu de `g` et `d`, un nœud porte `"fils":[1,2,3]` (6 enfants au plus) ; le parent est centré au-dessus de ses enfants. `visites` met en évidence, par exemple, les processus qui viennent d'être créés.
- Schéma `tube` : `{"type":"tube","gauche":{"nom":"Père","lecture":"ouvert","ecriture":"ferme"},"droite":{"nom":"Fils","lecture":"ferme","ecriture":"ouvert"},"tampon":"bonjour"}`. `droite` est facultatif (un seul processus avant le `fork`) ; chaque bout vaut `"ouvert"` ou `"ferme"` ; `tampon` est le contenu du tube (24 caractères max, vide si absent).
- Table des descripteurs (`dup2`, sockets) : schéma `tableau` où l'indice est le numéro du descripteur et la valeur ce qu'il désigne (`tty`, `lec`, `écr`, `–` pour fermé) ; `marques` nomme les cases (`p[0]`, `sock`).
- Sans `schema`, les variables s'affichent seules dans un cadre (utile pour un entrelacement de threads ou l'état d'un signal).
- Une pile ou une file se dessine avec un schéma `tableau` ou `liste`. Une liste circulaire ou une copie de liste utilise `liste` : le tableau `noeuds` est affiché de gauche à droite, un `suivant` qui revient en arrière est tracé en arc.
- Reprendre le code exact du cours et décrire chaque étape fidèlement : un pas à pas faux est pire que pas de pas à pas. `node tools/check_contenu.js` valide le format ; relire aussi l'exécution à la main.

## Fichiers à ne pas versionner

- `support.pdf` des profs (droits d'auteur) : ignoré par git, les mettre à côté de la séance pour qu'ils s'affichent en local. `fiche.pdf` (fiche de révision de l'utilisateur) est versionnable.
- `tools/snapshots/`, `.env`, tout ce qui vient d'eCampus.

## Le reste du projet

- `js/` : le site (routeur `app.js`, stockage local `store.js`, synchro `sync.js`, quiz, cartes). Ne pas le modifier pour ajouter un cours.
- `tests/` : `node --test tests/*.test.js`.
- `extension/` et `tools/ecampus_snapshot.py` : chantier eCampus séparé.
- Les fichiers du dépôt sont en CRLF : conserver les fins de ligne en modifiant du code.
- En modifiant un module JS, incrémenter son `?v=` dans les imports qui le chargent (cache navigateur).
