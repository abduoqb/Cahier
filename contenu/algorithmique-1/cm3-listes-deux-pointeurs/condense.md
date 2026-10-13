# CM3 — Listes à deux pointeurs, doublement chaînées, circulaires

**Définitions**
- Liste à deux pointeurs : `structure liste2 : premier, dernier`. Insertion en fin en O(1).
- Doublement chaînée : nœud `(precedent, valeur, suivant)`. Seule nouveauté : le retour en arrière.
- Circulaire : on pointe sur le DERNIER ; le premier est `L->suivant`. Un seul nœud : `L->suivant = L`.

![Liste à deux pointeurs](img/algo-liste-deux-pointeurs.svg)
![Liste circulaire](img/algo-liste-circulaire.svg)

| Opération | Simple | 2 pointeurs | Circulaire | Doublement chaînée |
|---|---|---|---|---|
| Insertion / suppression début | O(1) | O(1) | O(1) | O(1) |
| Insertion fin | O(n) | O(1) | O(1) | O(n) |
| Suppression fin | O(n) | O(n) | O(n) | O(n) |

**Patrons à retenir**
- Insertion en fin circulaire = insertion en début puis `retourner L->suivant`.
- Fusion de deux listes triées : comparer les têtes, recopier la plus petite (doublons conservés), coût n1 + n2.

| Piège | Bon réflexe |
|---|---|
| Liste à 2 pointeurs : oublier `dernier` quand elle devient vide | Mettre `premier` ET `dernier` à jour |
| Doublement chaînée : oublier `precedent` du voisin | Quatre liens à l'insertion au milieu |
| Croire la suppression en fin en O(1) | Il faut l'avant-dernier : O(n) sans `precedent` |
