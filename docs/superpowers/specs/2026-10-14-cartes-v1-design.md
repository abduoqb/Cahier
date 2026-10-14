# Cahier : flashcards (cartes v1)

Date : 2026-10-14. Statut : conception validée en conversation (parties 1 et 2), l'utilisateur a autorisé l'enchaînement spec → plan → code sans nouvelle validation.

## Intention

Réviser vite ce qui se retient par cœur (définitions, coûts, propriétés) : 10 cartes en moins de 2 minutes. Les cartes complètent le quiz QCM, qui reste le **seul** moyen de valider une notion. Les cartes ont leur propre répétition espacée, séparée de la progression des notions.

## Décisions de l'utilisateur

1. Chaque carte a son propre calendrier (pas d'effet sur `progress.js`).
2. Boîtes de Leitner avec deux boutons : « Je ne savais pas » / « Je savais ».
3. Les cartes dues se révisent depuis « Aujourd'hui », à côté du quiz (deux compteurs, deux boutons).
4. 10 nouvelles cartes par jour au maximum.
5. L'onglet « Cartes » d'une séance est une révision libre qui ne modifie pas le calendrier.

## Contenu

`contenu/<matière>/<séance>/cartes.json` (optionnel) :
```json
{ "seance": "cm4-piles-files", "cartes": [
  { "id": "c-cm4-piles-files-001", "notion": "pile",
    "recto": "Coût de depiler sur une pile par liste chaînée ?",
    "verso": "O(1) : on retire le premier nœud.",
    "source": "CM4 chapitre, tableau Implémentations et coûts" } ] }
```
- `id` stable au format `c-<séance>-<nnn>`, unique ; ne jamais le changer (le calendrier s'y rattache).
- `notion` déclarée dans `index.json` pour la séance.
- `recto` ≤ 200 caractères ; `verso` ≤ 120 caractères, une seule ligne.
- `source` obligatoire ; l'annale 2023-2024 est interdite (source, recto, verso).
- Dans `index.json`, une séance avec cartes porte `"cartes": true`. Un `cartes.json` sans ce drapeau est une erreur.
- Règles de rédaction : annales d'abord, puis TD et CM ; une idée par carte ; verso court ; toute fonction citée est décrite en une phrase ; pas de traces de code (c'est le rôle du quiz). 8 à 10 cartes pour CM1 à CM5.

## Calendrier (`js/cartes-etat.js`, module pur)

Clé `localStorage` `cahier.cartes.v1` : `{ cartes: { <id>: { boite, prochaine, vue } }, nouvelles: { jour, n } }`.
- `BOITES = [1, 3, 7, 14, 30]` jours, `NOUVELLES_PAR_JOUR = 10`.
- Carte jamais notée : pas d'état (« nouvelle »).
- `noter(id, ok, now)` : ok → boîte + 1 (plafond 5) ; sinon boîte 1. Une nouvelle carte part donc en boîte 2 (ok) ou 1. `prochaine = now + BOITES[boite - 1] jours`. Noter une nouvelle carte incrémente le compteur du jour (remis à zéro au changement de jour calendaire local).
- `cartesDues(ids, now)` : ids notés dont `prochaine ≤ now`, les plus en retard d'abord.
- `nouvellesDuJour(ids, now, max)` : ids jamais notés, dans l'ordre donné, limités à `max − déjà introduites aujourd'hui`.
- `sessionDuJour(cartes, now, max)` : `{ dues, nouvelles }` en objets carte.
- Enregistrements mal formés ignorés au chargement ; stockage indisponible → mémoire.

## Écrans

- Composant `lancerCartes(conteneur, cartes, { onNote, onFin, libre })` : recto ; « Voir la réponse » (Espace) ; verso + source ; « Je ne savais pas » (1) / « Je savais » (2) ; bilan « N sur T sues » ; en mode libre, « Refaire celles ratées ».
- Page séance : 4e onglet « Cartes » si `"cartes": true`, révision libre mélangée, sans `noter`.
- Accueil : la carte « Aujourd'hui » affiche aussi « N cartes à revoir (dont k nouvelles) » et un bouton vers `#/cartes-du-jour`.
- `#/cartes-du-jour` : dues d'abord, puis nouvelles dans l'ordre de l'index ; chaque réponse appelle `noter` ; la séance d'origine est affichée sur chaque carte.
- Erreurs : un `cartes.json` ou `quiz.json` illisible est ignoré avec un message discret ; la session continue (corrige la dette de `today.js`).

## Vérification

`tools/check_contenu.js` vérifie les cartes (schéma, ids, notions, longueurs, verso sur une ligne, source, annale réservée, cohérence du drapeau). Tests `node:test` pour `cartes-etat.js` et le vérificateur. L'interface n'est vérifiable que dans un navigateur, par l'utilisateur.

## Hors périmètre

Cartes générées automatiquement depuis le quiz, réglage du nombre de nouvelles cartes, statistiques, synchronisation, effet des cartes sur les notions.
