# CM1 — Tableaux, en bref

**Définitions**
- Coût = nombre d'opérations qu'on a choisi de compter (accès, comparaisons), en fonction de n. Toujours dire ce qu'on compte.
- Parcours complet (`pour`) : coût toujours n. Parcours avec arrêt (`tant que`) : entre 1 et n, donc meilleur cas et pire cas.
- Tri à bulles : on compare les voisins ; à chaque passage le plus grand restant va en place. Arrêt si aucun échange.
- Dichotomie (tableau trié) : au plus log2(n+1) cases examinées pour n = 2^k - 1.

**Patrons à retenir**
```text
tant que i < n et tab[i] <> x faire i = i + 1     // tester l'indice AVANT la case
maximum courant : si hausse alors courant = courant + hausse sinon courant = 0
```
- Tri à bulles : meilleur cas n-1 comparaisons (trié), pire cas n(n-1)/2 (décroissant).
- Partition avec pivot : n-1 tours quel que soit le tableau.

| Piège | Bon réflexe |
|---|---|
| Lire `tab[i]` avant d'avoir testé `i < n` | Mettre `i < n` en premier (le « et » est paresseux) |
| Donner un pire cas sans exemple | Donner un tableau qui atteint le cas (ex. 5 4 3 2 1) |
| Oublier ce qu'on compte | Le préciser avant la formule |
| Dichotomie sans `g = m + 1` ou `d = m - 1` | Boucle infinie : toujours exclure `m` |
| Recopier la trace du corrigé officiel | Recalculer : 5 4 3 2 1 donne 4 5 3 2 1 au premier échange |
