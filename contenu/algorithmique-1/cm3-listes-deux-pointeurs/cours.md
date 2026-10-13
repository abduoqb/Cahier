# CM 3 — Listes à deux pointeurs, doublement chaînées et circulaires

> **Info :** Rôle dans le cours
> Pas d'exercice dédié dans l'annale 2024-2025, mais c'est **la justification des coûts** des piles et files (CM4) : « pourquoi une file en O(1) ? → liste à deux pointeurs ou circulaire ».

## À savoir faire
- Citer les limites de la liste simple : un seul sens, **insertion/suppression en fin en O(n)**.
- Écrire `structure liste2` et `insereEnFin` en O(1) → Liste à deux pointeurs.
- Écrire `structure noeudDouble` et l'insertion/suppression en tête → Liste doublement chaînée.
- Expliquer pourquoi on pointe sur le **dernier** nœud d'une Liste circulaire.
- Remplir le tableau des coûts ci-dessous de mémoire.

## Le tableau qui résume tout le chapitre

| Opération | Liste simple (`L` = 1er) | Liste à 2 pointeurs | Liste circulaire (`L` = dernier) | Doublement chaînée |
|---|---|---|---|---|
| Insertion début | **O(1)** | **O(1)** | **O(1)** | **O(1)** |
| Suppression début | **O(1)** | **O(1)** | **O(1)** | **O(1)** |
| Insertion fin | O(n) | **O(1)** | **O(1)** | O(n)* |
| Suppression fin | O(n) | O(n) ⚠️ | O(n) ⚠️ | O(n)* |
| Retour en arrière | ✗ | ✗ | ✗ | ✓ |

\* O(1) si on garde aussi un pointeur sur le dernier nœud.
> **Règle** : on choisit la structure selon les opérations **les plus utilisées** ; on évite les opérations coûteuses. Suppression en fin reste O(n) dès qu'il faut trouver l'**avant-dernier** sans pointeur `precedent`.

## L'essentiel

### 1. Liste à deux pointeurs
```text
structure liste2
  premier : pointeur sur noeud
  dernier : pointeur sur noeud
```
![liste deux pointeurs](img/algo-liste-deux-pointeurs.svg)
```text
insereEnFin(L : liste2, n : entier)          // pas besoin de retourner : on modifie les champs
  tmp : pointeur sur noeud
  tmp = Nouveau(noeud) ; tmp->valeur = n ; tmp->suivant = None
  si L.premier = None alors
    L.premier = tmp ; L.dernier = tmp
  sinon
    L.dernier->suivant = tmp
    L.dernier = tmp
```
> ⚠️ Toujours penser à mettre à jour `dernier` quand la liste devient vide (suppression du seul nœud).

### 2. Liste doublement chaînée
```text
structure noeudDouble
  precedent : pointeur sur noeudDouble
  valeur : entier
  suivant : pointeur sur noeudDouble
type listeDouble = pointeur sur noeudDouble
```
![liste doublement chainee](img/algo-liste-doublement-chainee.svg)
Insertion en tête : créer `tmp` (precedent = None), `tmp->suivant = L`, **si L ≠ None** `L->precedent = tmp`, retourner `tmp`.
Suppression en tête : `tmp = L->suivant`, `désallouer(L)`, **si tmp ≠ None** `tmp->precedent = None`, retourner `tmp`.

### 3. Liste circulaire (pointeur sur le **dernier**)
![liste circulaire](img/algo-liste-circulaire.svg)
- Premier nœud = `L->suivant` → accès en O(1) au début **et** à la fin.
- Pas besoin d'un nouveau type de nœud. Liste à 1 nœud : `L->suivant = L`.

```text
insertionCirculaireDebut(L : liste, n : entier) : liste
  tmp : liste ; tmp = Nouveau(noeud) ; tmp->valeur = n
  si L = None alors
    tmp->suivant = tmp ; retourner tmp
  tmp->suivant = L->suivant        // tmp devant l'ancien premier
  L->suivant = tmp                 // le dernier pointe sur le nouveau premier
  retourner L                      // L reste le dernier

insertionCirculaireFin(L : liste, n : entier) : liste
  L = insertionCirculaireDebut(L, n)   // on insère en tête...
  retourner L->suivant                 // ...puis le nouveau nœud devient le dernier
```
> L'astuce de l'insertion en fin (même code + décaler `L` d'un cran) est typique : à savoir expliquer.

## Questions de vérification
1. Pourquoi la suppression en fin est-elle O(n) même avec un pointeur `dernier` ?
2. Dans une liste circulaire, pourquoi pointer sur le dernier plutôt que sur le premier ?
3. Quels pointeurs faut-il modifier pour insérer en tête d'une liste doublement chaînée ?
4. Quelle structure choisir pour implémenter une file en O(1) ?
