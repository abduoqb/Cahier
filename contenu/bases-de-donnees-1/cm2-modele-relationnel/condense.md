# CM2 — Modèle relationnel, en bref

**Définitions**
- Relation = sous-ensemble du produit cartésien de domaines ; attribut = colonne ; n-uplet = ligne. Ni ordre ni doublon.
- Schéma = nom, attributs, domaines (fixe). Extension = n-uplets actuels. Degré = nb d'attributs. Cardinalité = nb de n-uplets.
- Clé candidate = attributs qui déterminent un unique n-uplet (on vise le minimum). Clé primaire = celle qu'on choisit. Clé étrangère = renvoie vers la clé primaire d'une autre table.
- Fermeture : le résultat de toute opération est une relation.

**Patrons à retenir**
```text
Projection  R[A]   colonnes      Sélection  R:(F)   lignes
R × S : m × n n-uplets           R ⋈(F) S = (R × S) : F
R ∩ S = R − (R − S)              aucun / jamais :  A[X] − B[X]
toutes les… :  R / S             R ⋈ S : égalité sur les attributs communs
```
- Fondamentaux : projection, sélection, union, différence, produit.
- Cours : Personne × Voyage = 25 n-uplets ; Personne ⋈ Voyage = 5.

| Piège | Bon réflexe |
|---|---|
| Confondre degré et cardinalité | Degré = colonnes, cardinalité = lignes |
| Projection = filtrer des lignes | Projection = colonnes, sélection = lignes |
| `−` entre schémas différents | Projeter d'abord sur les mêmes attributs |
| « Aucun » traduit par une jointure avec ≠ | Utiliser la différence `A[X] − B[X]` |
| Oublier le `<` dans une auto-thêta-jointure | Sans lui : paires (A,A) et (A,B)/(B,A) en double |
| Chercher une division sans « toutes » | La division répond aux questions « pour tous » |
