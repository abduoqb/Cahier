# CM3 — SQL : requêtes, en bref

**Définitions**
- SELECT … FROM … WHERE = produit cartésien, puis sélection, puis projection. La jointure s'écrit dans le WHERE.
- SQL ne supprime pas les doublons : DISTINCT est à demander.
- LIKE : motif sur toute la chaîne (`%` = 0..n caractères, `_` = 1). REGEXP : motif présent n'importe où.
- NULL = valeur absente (≠ 0, ≠ ''). Les agrégats l'ignorent, sauf COUNT(*).
- `CREATE TABLE` crée la table **vide** ; `INSERT INTO` y ajoute des lignes ; `CREATE TABLE … AS SELECT` crée et remplit.
- WHERE filtre les lignes avant le regroupement ; HAVING filtre les groupes.

**Patrons à retenir**
```sql
FROM CLIENT C, COMMANDE COM WHERE COM.RefC = C.RefC          -- jointure par les clés
FROM CLIENT C1, CLIENT C2 WHERE C1.Ville = C2.Ville AND C1.NomC < C2.NomC   -- paires
CAT IS NULL        /  CAT IS NOT NULL
GROUP BY D.RefP ... HAVING SUM(...) > 10000
```
- Ordre logique : FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY (donc alias utilisable dans ORDER BY).
- `LIKE '%e%e%'` équivaut à `REGEXP 'e.*e'` ; `LIKE '_a%'` à `REGEXP '^.a'`.

| Piège | Bon réflexe |
|---|---|
| Oublier la condition de jointure | Une égalité de clés par jointure, sinon produit cartésien |
| Doublons après jointure | Ajouter DISTINCT |
| `CAT = NULL` | `IS NULL` / `IS NOT NULL` |
| `COUNT(CAT)` pris pour le nombre de lignes | `COUNT(*)` compte les lignes, `COUNT(CAT)` les non nuls |
| Agrégat dans WHERE | Le mettre dans HAVING (après GROUP BY) |
| `AND` / `OR` sans parenthèses | `AND` est prioritaire : parenthéser le OR |
| Paires avec `<>` ou sans condition | `<` strict : pas de (A,A), pas de doublon (A,B)/(B,A) |
