# CM1 — Introduction aux BD, en bref

**Définitions**
- SGBD : système (matériel + logiciel) pour rechercher, insérer, modifier, stocker et protéger les données avec un langage de haut niveau. Le SGBD est le logiciel, la base de données est ce qu'il gère.
- Objectifs : indépendance physique et logique, cohérence, partage, souplesse d'accès, performances, sécurité et contrôle.
- Gestion par fichiers : redondance, dépendance données/traitements, multiplicité des normes.
- Trois niveaux : externe (vue d'un utilisateur), conceptuel (schéma de la BD), interne (organisation physique).

**Patrons à retenir**
| Sigle | Rôle | Commandes |
|---|---|---|
| LDD | structure | CREATE, ALTER, DROP |
| LID | lire | SELECT |
| LMD | contenu | INSERT, UPDATE, DELETE |
| LCD | droits | GRANT, REVOKE |

- Tableau personnes-pays : redondance (infos répétées), incohérence (déménagement), perte d'information (supprimer « perou » supprime helena).
- Remède : séparer personnes et pays (modèle relationnel).

| Piège | Bon réflexe |
|---|---|
| Confondre SGBD et base de données | Logiciel d'un côté, données de l'autre |
| Confondre LDD et LMD | LDD = structure, LMD = contenu |
| Confondre indépendance physique et logique | Physique = stockage, logique = schéma conceptuel |
| Dire que la redondance est une incohérence | La redondance est la cause, l'incohérence la conséquence possible |
| Ranger SELECT dans le LMD | Dans ce cours, SELECT relève du LID |
