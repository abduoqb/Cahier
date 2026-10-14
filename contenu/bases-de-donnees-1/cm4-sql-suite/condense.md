# CM4 — SQL (agrégats, sous-requêtes, jointures externes), en bref

**Définitions**
- Agrégat (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) : une valeur sur un ensemble de lignes ; les `NULL` sont ignorés, sauf par `COUNT(*)`.
- `WHERE` filtre les lignes (avant regroupement) ; `HAVING` filtre les groupes (après `GROUP BY`).
- Sous-requête non corrélée : exécutée une fois ; corrélée : réévaluée pour chaque ligne externe.
- `x >= ALL (…)` : supérieur ou égal à toutes les valeurs ; `= ANY` équivaut à `IN`.
- `LEFT JOIN` : garde toute la table de gauche, `NULL` à droite sans correspondance. `UNION` : mêmes colonnes, doublons éliminés.
- `DELETE` / `UPDATE` sans `WHERE` : toutes les lignes sont touchées ; `DROP TABLE` supprime la table.
- Division = « pour tous » : `R/S = R[X] − ((R[X] × S) − R)[X]`.

**Patrons à retenir**
```sql
RefP NOT IN (SELECT RefP FROM DETAIL)                       -- n'a jamais
Prix = (SELECT MAX(Prix) FROM PRODUIT)  /  Prix >= ALL (…)  -- le plus cher, ex æquo compris
NOT EXISTS (SELECT * FROM COMMANDE COM WHERE COM.RefC = C.RefC)
GROUP BY … HAVING COUNT(DISTINCT TypeP) = (SELECT COUNT(DISTINCT TypeP) FROM PRODUIT)   -- pour tous
```
- Lignes à zéro : `LEFT JOIN` + `COALESCE(x, 0)`, ou `UNION` avec `SELECT RefC, 0 … NOT IN (…)`.

| Piège | Bon réflexe |
|---|---|
| `SELECT RefP, MAX(Prix) FROM PRODUIT` | Sous-requête scalaire : `Prix = (SELECT MAX(Prix) …)` |
| Agrégat dans le `WHERE` | Le mettre dans le `HAVING` |
| `NOT IN` avec un `NULL` dans la sous-requête | Filtrer `IS NOT NULL` ou utiliser `NOT EXISTS` |
| Condition sur la table de droite dans le `WHERE` d'un `LEFT JOIN` | La mettre dans le `ON` |
| `NATURAL JOIN` sans attribut commun | Produit cartésien silencieux : jointure explicite |
| `COUNT(P.TypeP)` dans la division | `COUNT(DISTINCT P.TypeP)` |
| Imbriquer quand une jointure suffit | Même granularité : jointure |
