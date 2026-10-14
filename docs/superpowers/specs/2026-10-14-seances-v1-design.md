# Cahier : séances et entraînement (v1)

Date : 2026-10-14. Statut : à relire par l'utilisateur avant tout code.

## Intention

Étudiant L2 Informatique (UNICAEN). Un seul outil de révision quotidien. Le contenu vient du PDF du prof, généré par Claude Code, relu par l'étudiant. Ses notes papier restent privées. Une notion n'est « acquise » que si elle a été validée par un quiz, jamais par une simple lecture. Échéance réelle : CT d'algorithmique en décembre.

## Périmètre v1

Une seule matière réelle : **Algorithmique 1, 4 à 6 séances**.

Inclus :
1. Serveur local lançable d'une commande (`python -m http.server`) et `contenu/index.json`.
2. Page séance : rappel libre, puis onglets Cours (PDF en iframe + `cours.md`), Condensé (`condense.md`).
3. Quiz **QCM** avec correction immédiate, explication et source.
4. `progress.js` : validation par notion, retour à « à revoir ».
5. « Aujourd'hui » minimal : un bouton qui lance les notions à revoir ; repli sur les annales prêtes.
6. Liste des séances sous chaque matière, avec un état.

Exclus (gelés jusqu'à usage réel) : flashcards complètes, questions ouvertes et grille de critères, correction par Claude (export/import), statistiques détaillées, carte de chaleur, série de jours, téléphone et synchronisation, extension eCampus.

> Hypothèse à confirmer : flashcards hors v1 (le quiz QCM seul d'abord).

## Données

### Contenu (fixe, écrit par Claude Code)

```
contenu/index.json
contenu/<matiere>/<seance>/support.pdf
contenu/<matiere>/<seance>/cours.md
contenu/<matiere>/<seance>/condense.md
contenu/<matiere>/<seance>/quiz.json
```

`index.json` :
```json
{ "matieres": [ { "id": "algorithmique-1", "nom": "Algorithmique 1",
  "seances": [ { "id": "cm03-listes", "type": "CM", "titre": "Listes chaînées", "dossier": "algorithmique-1/cm03-listes" } ] } ] }
```

`quiz.json` :
```json
{ "seance": "cm03-listes", "questions": [
  { "id": "q-cm03-001", "notion": "listes-insertion", "type": "qcm",
    "enonce": "…", "choix": ["…","…","…","…"], "bonne": 2,
    "explication": "Une phrase.", "source": "annale 2024-2025, ex. 2" } ] }
```
- `id` stable : ne jamais le changer en régénérant (la progression s'y rattache).
- Règle de génération : questions tirées des annales d'abord, `source` obligatoire, réponses courtes. Une partie des annales est **réservée aux tests blancs** et n'alimente pas les questions.

### Progression (navigateur)

Clé `localStorage` `cahier.progress.v1`, indépendante des données existantes. Tout passe par `js/progress.js` :

```js
getNotion(seanceId, notionId)            // { etat, reussites, derniere, prochaine }
recordAnswer(seanceId, q, ok, now)       // met à jour la notion de la question
notionsDues(now)                         // liste triée pour « Aujourd'hui »
etatSeance(seanceId, notionsIds, now)    // 'pas-commencee' | 'en-cours' | 'acquise' | 'a-revoir'
```

Règles : une notion est **acquise** après 2 réussites espacées d'au moins un jour ; elle repasse **à revoir** à +3 jours, puis +1 semaine, +1 mois sans pratique. Une séance est acquise quand toutes ses notions le sont.

## Pages

- Accueil : agenda existant, « Aujourd'hui », matières.
- `#/subject/<id>` : liste des séances avec état (s'ajoute à `renderSubject`).
- `#/seance/<matiere>/<seance>` : rappel libre (« note 3 choses que tu sais déjà », non stocké), onglets Cours / Condensé / S'entraîner.
- Même palette papier/terracotta, Fraunces italique.

## Découpage pour agents (fichiers disjoints, interfaces ci-dessus figées)

| Agent | Fichiers | Ne touche pas |
|---|---|---|
| A. Contenu | `contenu/**`, `contenu/index.json` (séances d'algo depuis le vault) | `js/`, `css/` |
| B. Progression | `js/progress.js` + tests Node | tout le reste |
| C. Interface | `js/seance.js`, `js/quiz.js`, routage dans `app.js`, styles | `progress.js`, `contenu/` |

Intégration (« Aujourd'hui », liste des séances) faite ensuite par une seule session. Test : le serveur local, une séance réelle, un quiz de bout en bout.

## Risques

- Contenu : chaque séance doit coûter peu de temps à générer, sinon le site reste vide.
- `file://` bloque modules et `fetch` : serveur obligatoire.
- Droits : ne pas héberger publiquement les PDF des profs.
