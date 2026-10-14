# CM5 — Arbres, en bref

**Définitions**
- Arbre binaire : vide, ou racine + sous-arbre gauche + sous-arbre droit. `structure noeud : valeur, gauche, droit`.
- Profondeur d'un nœud : longueur du chemin depuis la racine (racine : 0). Hauteur : plus grande profondeur ; h(vide) = -1, h(racine seule) = 0.
- LC = somme des profondeurs de tous les nœuds ; LCE = somme des profondeurs des feuilles.
- Préfixe, infixe, suffixe = affichage à la 1re, 2e, 3e visite du nœud (avant, entre, après les deux appels).

![Arbre exemple du cours](img/algo-arbre-exemple-cm5.svg)

**Patron récursif** : `si A = None alors retourner <neutre>` puis combiner `f(A->gauche)` et `f(A->droit)`.
- Compter : neutre 0, `(1 si condition) + f(g) + f(d)`. Existence : neutre Faux, `C ou f(g) ou f(d)`. Hauteur : neutre -1, `1 + max`.
- Coût : n si on visite tout, au plus h + 1 si on suit une seule branche.
- Largeur : niveau par niveau avec une file (7 4 2 12 9 20 1 5 11 sur l'exemple) ; profondeur : récursif ou pile.

| Piège | Bon réflexe |
|---|---|
| Confondre profondeur (nœud) et hauteur (arbre) | Profondeur depuis la racine, hauteur = profondeur max |
| Feuille testée avec `ou` | `A->gauche = None et A->droit = None` |
| Compter et chercher au même coût | Chercher peut s'arrêter dès le premier trouvé |
