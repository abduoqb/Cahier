# TD — Révision générale, en bref

**Méthode** : une propriété sur un ensemble défini par induction se démontre cas par cas (base, puis chaque règle) ; une égalité d'ensembles par double inclusion ; une propriété d'application avec un contre-exemple ou une résolution d'équation.

| Notion | À retenir |
|---|---|
| Induction sur les arbres | Base : l'arbre racine. Hérédité : P(B) et P(C) donnent P(A). N(A) = N(B) + N(C) + 1, h(A) = 1 + max(h(B), h(C)), racine seule h = 0. |
| Ensembles | A \ B = {x ∈ A, x ∉ B}. A Δ B = (A \ B) ∪ (B \ A). Égalité = double inclusion. (A \ B) ∪ (B \ A) = A ∪ B si et seulement si A ∩ B = ∅. |
| Injection, surjection, bijection | Injective : au plus un antécédent. Surjective : au moins un. Bijective : les deux. Injection si Card(E) ≤ Card(F), surjection si Card(E) ≥ Card(F). Réciproque : résoudre y = f(x). |
| Relations d'équivalence | Réflexive, symétrique, transitive. [x] = {y | y R x}. R : f(x) = f(y) est d'équivalence ; classes à un élément si et seulement si f injective. |
| Dénombrement | Choix successifs : n^k. Sans ordre : C(n, k). Complémentaire, cas disjoints, inclusion-exclusion : total − A − B + (A ∩ B). |
| Probabilités | P(A) = Card(A) / Card(E). Indépendants si P(A ∩ B) = P(A)P(B). E[X] = Σ valeur × probabilité. E[X₁ + … + Xₙ] = n E[X]. |
