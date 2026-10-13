# CM4 — Piles et files, en bref

**Définitions**
- Pile (LIFO) : `initPile, pileVide, sommet, empiler, depiler`. File (FIFO) : `initFile, fileVide, tete, enfiler, defiler`.
- `sommet`, `depiler`, `tete`, `defiler` supposent la structure non vide : tester `pileVide` / `fileVide` avant.
- Hanoï : 2^n - 1 déplacements (15 pour n = 4), car T(n) = 2T(n-1) + 1.

![Pile et file](img/algo-pile-file.svg)

| Implémentation | Pile | File |
|---|---|---|
| Tableau (`T[0]` = nombre d'éléments) | tout en O(1) | `defiler` en O(n) |
| Liste simple (tête = 1er nœud) | tout en O(1) | `enfiler` en O(n) |
| Liste à 2 pointeurs ou circulaire | — | tout en O(1) |

**Patrons à retenir**
- Bon parenthésage : `(` empile ; `)` avec pile vide donne Faux, sinon dépile ; à la fin retourner `pileVide(P)`.
- Dérécursiver : empiler pendant la descente, puis dépiler en affichant (ordre inversé).

| Piège | Bon réflexe |
|---|---|
| Un compteur pour deux types de parenthèses | Une pile, pour retenir le type de l'ouvrante |
| `depiler` : lire `P->suivant` après `désallouer(P)` | Sauvegarder `tmp = P->suivant` d'abord |
| File circulaire : retourner `F` dans `enfiler` | Retourner `tmp`, le nouveau dernier |
