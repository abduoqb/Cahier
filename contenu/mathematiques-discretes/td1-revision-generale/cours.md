# TD — Révision générale

> **Info :** Source : les types d'exercices des annales 2025-2026 (CC1 et examen terminal, première session). Les énoncés eux-mêmes sont dans le partiel blanc de la matière ; les questions de cette séance en sont des variantes avec d'autres nombres.

## À savoir faire
- Écrire le schéma d'induction d'un ensemble d'arbres et démontrer une propriété par induction structurelle.
- Démontrer une inclusion ou une égalité d'ensembles par double inclusion, en raisonnant sur un élément.
- Dire si une application est injective, surjective, bijective, et justifier avec un contre-exemple ou une preuve.
- Montrer qu'une relation est d'équivalence et décrire une classe.
- Choisir entre produit, arrangement avec répétition, combinaison et inclusion-exclusion.
- Calculer une probabilité, une espérance, et tester l'indépendance de deux événements.

## L'essentiel

### 1. Induction sur les arbres binaires
Un ensemble d'arbres se définit par un **schéma d'induction** : des cas de base et des règles de construction. Pour les arbres binaires localement complets (chaque nœud a 0 ou 2 fils), noté LC :

1. L'arbre réduit à une racine appartient à LC.
2. Si B et C sont dans LC, alors l'arbre dont la racine a pour fils gauche B et fils droit C est dans LC.

Pour montrer P(A) pour tout A de LC, on vérifie **un cas par règle** :

| Étape | Ce qu'on démontre |
|---|---|
| Base | P est vraie pour l'arbre racine. |
| Hérédité | Si P(B) et P(C), alors P(A) pour A = (racine, B, C). |

Notations : N(A) est le nombre de nœuds, h(A) la hauteur (en arêtes : la racine seule a h = 0).
Pour un arbre A construit à partir de B et C : N(A) = N(B) + N(C) + 1 et h(A) = 1 + max(h(B), h(C)).

Exemple : P(A) : N(A) ≥ 2h(A) + 1. Dans l'hérédité, on suppose h(B) ≥ h(C), donc h(A) = h(B) + 1. Comme C a au moins un nœud, N(A) ≥ N(B) + 2 ≥ (2h(B) + 1) + 2 = 2h(B) + 3 = 2h(A) + 1. L'égalité est atteinte par les arbres en « peigne ».

```pas-a-pas
{
  "titre": "N(A) et h(A) sur un arbre localement complet",
  "code": [
    "N(feuille) = 1 ; h(feuille) = 0",
    "N(A) = N(B) + N(C) + 1",
    "h(A) = 1 + max(h(B), h(C))",
    "Propriété : N(A) >= 2*h(A) + 1"
  ],
  "etapes": [
    {"ligne": 0, "note": "Le nœud 1 est une feuille : N = 1 et h = 0.", "vars": {"N(1)": 1, "h(1)": 0},
     "schema": {"type": "arbre", "noeuds": [{"v": "0", "g": 1, "d": 2}, {"v": "1", "g": null, "d": null}, {"v": "2", "g": 3, "d": 4}, {"v": "3", "g": null, "d": null}, {"v": "4", "g": null, "d": null}], "racine": 0, "visites": [], "courant": 1}},
    {"ligne": 0, "note": "Les nœuds 3 et 4 sont aussi des feuilles.", "vars": {"N(3)": 1, "h(3)": 0, "N(4)": 1, "h(4)": 0},
     "schema": {"type": "arbre", "noeuds": [{"v": "0", "g": 1, "d": 2}, {"v": "1", "g": null, "d": null}, {"v": "2", "g": 3, "d": 4}, {"v": "3", "g": null, "d": null}, {"v": "4", "g": null, "d": null}], "racine": 0, "visites": [1, 3], "courant": 4}},
    {"ligne": 1, "note": "Nœud 2 : N(2) = 1 + 1 + 1 = 3.", "vars": {"N(2)": 3},
     "schema": {"type": "arbre", "noeuds": [{"v": "0", "g": 1, "d": 2}, {"v": "1", "g": null, "d": null}, {"v": "2", "g": 3, "d": 4}, {"v": "3", "g": null, "d": null}, {"v": "4", "g": null, "d": null}], "racine": 0, "visites": [1, 3, 4], "courant": 2}},
    {"ligne": 2, "note": "Nœud 2 : h(2) = 1 + max(0, 0) = 1.", "vars": {"h(2)": 1}},
    {"ligne": 1, "note": "Racine : N(0) = N(1) + N(2) + 1 = 1 + 3 + 1 = 5.", "vars": {"N(0)": 5},
     "schema": {"type": "arbre", "noeuds": [{"v": "0", "g": 1, "d": 2}, {"v": "1", "g": null, "d": null}, {"v": "2", "g": 3, "d": 4}, {"v": "3", "g": null, "d": null}, {"v": "4", "g": null, "d": null}], "racine": 0, "visites": [1, 2, 3, 4], "courant": 0}},
    {"ligne": 2, "note": "Racine : h(0) = 1 + max(h(1), h(2)) = 1 + max(0, 1) = 2.", "vars": {"h(0)": 2}},
    {"ligne": 3, "note": "N(0) = 5 et 2 × h(0) + 1 = 5 : la propriété est vraie, avec égalité.", "vars": {"2*h(0)+1": 5}}
  ]
}
```

### 2. Ensembles
- A \ B = {x ∈ E | x ∈ A et x ∉ B}.
- A Δ B = (A \ B) ∪ (B \ A) : les éléments dans l'un des deux ensembles seulement.
- **Inclusion** X ⊂ Y : on prend x ∈ X et on montre x ∈ Y. **Égalité** : double inclusion.
- Une disjonction (« ou ») se démontre par **cas** : on traite chaque cas jusqu'à la conclusion.
- Identités utiles : (X \ A) ∪ A = X ∪ A ; X \ A = X ∩ Ā ; (A \ B) ∪ (B \ A) = A ∪ B si et seulement si A ∩ B = ∅.

### 3. Injection, surjection, bijection
Soit f : E → F.

| Propriété | Définition | Pour la réfuter |
|---|---|---|
| Injective | tout y de F a **au plus** un antécédent | deux éléments distincts de même image |
| Surjective | tout y de F a **au moins** un antécédent | un y de F sans antécédent |
| Bijective | injective et surjective | l'un des deux contre-exemples |

- Il existe une injection de E dans F seulement si Card(E) ≤ Card(F), une surjection seulement si Card(E) ≥ Card(F).
- Pour une bijection, on résout « y = f(x) » d'inconnue x : une solution unique par y donne la bijection réciproque.
- Pour une fonction définie par morceaux, on traite **chaque morceau** et on vérifie les valeurs que les morceaux ne couvrent pas.

### 4. Relations d'équivalence
Une relation R sur E est d'équivalence si elle est **réflexive**, **symétrique** et **transitive**.
- La classe de x est [x] = {y ∈ E | y R x}.
- Pour R définie par « f(x) = f(y) » : R est toujours d'équivalence (l'égalité l'est). Les classes sont les ensembles d'éléments de même image, et chaque classe est un singleton si et seulement si f est injective.
- Pour « x R y si X ∪ A = Y ∪ A » : chaque propriété se ramène à l'égalité d'ensembles.

### 5. Dénombrement
| Situation | Formule |
|---|---|
| k choix successifs, n possibilités chacun (répétitions permises) | n^k |
| k éléments parmi n, sans ordre, sans répétition | C(n, k) |
| Cas disjoints | on additionne |
| Complémentaire | total moins le cas contraire |
| « Au moins un » de deux critères | inclusion-exclusion : total − A − B + (A ∩ B) |

Pour une contrainte sur un élément (« le premier chiffre est pair »), on choisit **d'abord** l'élément contraint.

### 6. Probabilités
- Espace de probabilité : l'ensemble des issues. Distribution uniforme : P(e) = 1 / Card(E).
- Événement A : P(A) = Card(A) / Card(E). Une probabilité de 1/2 exige Card(E) pair.
- **Indépendance** : A et B sont indépendants si et seulement si P(A ∩ B) = P(A) × P(B). On calcule les trois termes puis on compare.
- Variable aléatoire X : E[X] = somme de (valeur × probabilité).
- Linéarité : pour n répétitions, E[X₁ + … + Xₙ] = n × E[X], sans avoir besoin de l'indépendance.

## Pièges fréquents
- **Hauteur** : la racine seule a h = 0 (pas 1) ; sinon la propriété N ≥ 2h + 1 se décale.
- **Induction** : oublier de dire quelle hypothèse on utilise, ou de traiter le cas de base.
- **Preuve en cas** : conclure avant d'avoir traité tous les cas (« x ∈ A » ET « x ∈ B » ne sont pas les deux seuls cas possibles quand on raisonne sur A \ B).
- **Fonction par morceaux** : vérifier la surjectivité en testant les petites valeurs. Pour g(x) = −2x + 1 sur les négatifs, l'image est 3, 5, 7… et **1 n'est pas atteint**.
- **Cardinaux** : une surjection de A dans B est impossible quand Card(A) < Card(B) ; l'argument est le nombre d'éléments de A, pas des « antécédents en double ».
- **Dénombrement** : confondre ordre pertinent (n^k) et ordre non pertinent (C(n, k)).
- **Probabilités** : croire qu'un événement de probabilité 1/2 existe toujours ; oublier que 0 est pair, donc compté dans « résultat pair » à la roulette.
- **Linéarité de l'espérance** : n'exige aucune hypothèse d'indépendance, contrairement à la variance.
