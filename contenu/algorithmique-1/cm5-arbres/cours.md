# CM 5 — Structures arborescentes

> **Info :** Annale 2024-2025 : 3 pts arbres binaires (comptage récursif, coût n) + 6 pts forêts (accumulateur sur une branche)
> Arbres binaires : redéfinir `noeud`/`arbreBinaire`, écrire des parcours récursifs, compter les nœuds vérifiant une condition, **coût en fonction de n**.
> Forêts (représentation premier enfant / fratrie, vue aux CM suivants) : parcourir les branches avec un accumulateur.

## À savoir faire
- Donner les définitions inductives d'un Arbre général et d'un Arbre binaire.
- Utiliser le vocabulaire : racine, enfant, parent, descendant, Nœud interne et feuille, Branche.
- Calculer Profondeur et hauteur, Longueur de cheminement (interne / externe) sur un dessin.
- Écrire N(A), N_f(A), N_i(A), h(A) **inductivement** → et donc en **procédure récursive**.
- Écrire `structure noeud` (valeur, gauche, droit) + `type arbreBinaire`.
- Donner l'ordre de visite en largeur et en profondeur (préfixe, infixe, suffixe).

## Arbre exemple du cours (à savoir exploiter)

![arbre exemple cm5](img/algo-arbre-exemple-cm5.svg)

| Mesure | Valeur | Calcul |
|---|---|---|
| N(A) nœuds | 9 | |
| N_f(A) feuilles | 4 | 12, 1, 5, 11 |
| N_i(A) internes | 5 | 7, 4, 9, 2, 20 → N = N_i + N_f ✔ |
| Hauteur h | 3 | profondeur max (1, 5, 11) |
| LC (cheminement) | 17 | 0 + 1+1 + 2+2+2 + 3+3+3 |
| LCE (externe) | 11 | 2 + 3+3+3 (feuilles seulement) |
| Largeur | 7 4 2 12 9 20 1 5 11 | niveau par niveau |
| Préfixe | 7 4 12 9 1 2 20 5 11 | 1ʳᵉ visite |
| Infixe | 12 4 1 9 7 5 20 11 2 | 2ᵉ visite |
| Suffixe | 12 1 9 4 5 11 20 2 7 | 3ᵉ visite |

> **Astuce :** Méthode « trois visites » : on fait le tour de l'arbre en longeant les branches par la gauche. Chaque nœud est rencontré 3 fois (avant G, entre G et D, après D). Préfixe = on note à la 1ʳᵉ, infixe à la 2ᵉ, suffixe à la 3ᵉ.

## L'essentiel

### 1. Structure
```text
structure noeud
  valeur : entier
  gauche : pointeur sur noeud
  droit : pointeur sur noeud
type arbreBinaire = pointeur sur noeud      // arbre vide = None
```

### 2. Des définitions inductives aux procédures récursives
Chaque définition du cours se traduit **mot pour mot** en procédure — c'est exactement ce que demande l'examen.

| Définition inductive | Procédure |
|---|---|
| N(∅) = 0 ; N(A) = 1 + N(A_g) + N(A_d) | `si A = None retourner 0` ; `retourner 1 + taille(A->gauche) + taille(A->droit)` |
| N_f(∅) = 0 ; N_f(•) = 1 ; sinon N_f(A_g) + N_f(A_d) | tester `A->gauche = None et A->droit = None` pour la feuille |
| h(∅) = −1 ; h(A) = 1 + max(h(A_g), h(A_d)) | `retourner 1 + max(hauteur(A->gauche), hauteur(A->droit))` |

```text
nombreFeuilles(A : arbreBinaire) : entier
  si A = None alors retourner 0
  si A->gauche = None et A->droit = None alors retourner 1
  retourner nombreFeuilles(A->gauche) + nombreFeuilles(A->droit)

affichagePrefixe(A : arbreBinaire)            // infixe / suffixe : déplacer le "afficher"
  si A <> None alors
    afficher A->valeur
    affichagePrefixe(A->gauche)
    affichagePrefixe(A->droit)
```

**À toi de jouer — parcours préfixe pas à pas** sur l'arbre exemple du cours
```pas-a-pas
{
  "titre": "affichagePrefixe sur l'arbre du cours",
  "code": [
    "affichagePrefixe(A : arbreBinaire)",
    "  si A <> None alors",
    "    afficher A->valeur",
    "    affichagePrefixe(A->gauche)",
    "    affichagePrefixe(A->droit)"
  ],
  "etapes": [
    {"ligne":0,"vars":{"sortie":"(vide)"},"note":"On appelle affichagePrefixe sur la racine (7). Le nœud rouge est celui qu'on affiche, les verts sont déjà affichés.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":0},"visites":[],"courant":null}},
    {"ligne":2,"vars":{"sortie":"7"},"note":"Préfixe : on affiche le nœud avant de visiter ses enfants. La racine d'abord : 7.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":0},"visites":[],"courant":0}},
    {"ligne":2,"vars":{"sortie":"7 4"},"note":"On descend à gauche : 4 est affiché avant ses propres enfants.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":1},"visites":[0],"courant":1}},
    {"ligne":2,"vars":{"sortie":"7 4 12"},"note":"Encore à gauche : 12, une feuille. Ses deux sous-arbres sont vides, la récursion remonte.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":3},"visites":[0,1],"courant":3}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9"},"note":"De retour en 4, on part à droite : 9.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":4},"visites":[0,1,3],"courant":4}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9 1"},"note":"À gauche de 9 : 1, une feuille. Le sous-arbre droit de 9 est vide.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":6},"visites":[0,1,3,4],"courant":6}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9 1 2"},"note":"Tout le côté gauche de 7 est fini : on passe à droite, 2.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":2},"visites":[0,1,3,4,6],"courant":2}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9 1 2 20"},"note":"À gauche de 2 : 20.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":5},"visites":[0,1,3,4,6,2],"courant":5}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9 1 2 20 5"},"note":"À gauche de 20 : 5, une feuille.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":7},"visites":[0,1,3,4,6,2,5],"courant":7}},
    {"ligne":2,"vars":{"sortie":"7 4 12 9 1 2 20 5 11"},"note":"À droite de 20 : 11, la dernière feuille.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":8},"visites":[0,1,3,4,6,2,5,7],"courant":8}},
    {"ligne":null,"note":"Fin : tous les nœuds sont visités, la sortie est 7 4 12 9 1 2 20 5 11.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{},"visites":[0,1,3,4,6,2,5,7,8],"courant":null}}
  ]
}
```

**Et en infixe** : on déplace seulement la ligne `afficher`, et l'ordre change
```pas-a-pas
{
  "titre": "affichageInfixe sur l'arbre du cours",
  "code": [
    "affichageInfixe(A : arbreBinaire)",
    "  si A <> None alors",
    "    affichageInfixe(A->gauche)",
    "    afficher A->valeur",
    "    affichageInfixe(A->droit)"
  ],
  "etapes": [
    {"ligne":0,"vars":{"sortie":"(vide)"},"note":"Même arbre, même récursion : seule la position de « afficher » change. On appelle affichageInfixe sur la racine (7).","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":0},"visites":[],"courant":null}},
    {"ligne":3,"vars":{"sortie":"12"},"note":"Infixe : on affiche un nœud après son sous-arbre gauche. On descend tout à gauche jusqu'à 12, qui est affiché en premier.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":3},"visites":[],"courant":3}},
    {"ligne":3,"vars":{"sortie":"12 4"},"note":"On remonte en 4 : son sous-arbre gauche est terminé, on l'affiche.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":1},"visites":[3],"courant":1}},
    {"ligne":3,"vars":{"sortie":"12 4 1"},"note":"Sous-arbre droit de 4 : on descend à gauche de 9, jusqu'à 1, qui est affiché.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":6},"visites":[3,1],"courant":6}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9"},"note":"On remonte en 9 : on l'affiche (son sous-arbre droit est vide).","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":4},"visites":[3,1,6],"courant":4}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9 7"},"note":"Tout le sous-arbre gauche de 7 est terminé : la racine est affichée au milieu.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":0},"visites":[3,1,6,4],"courant":0}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9 7 5"},"note":"Sous-arbre droit de 7 : on descend à gauche de 2 puis de 20, jusqu'à 5.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":7},"visites":[3,1,6,4,0],"courant":7}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9 7 5 20"},"note":"On remonte en 20 : on l'affiche.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":5},"visites":[3,1,6,4,0,7],"courant":5}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9 7 5 20 11"},"note":"Sous-arbre droit de 20 : 11.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":8},"visites":[3,1,6,4,0,7,5],"courant":8}},
    {"ligne":3,"vars":{"sortie":"12 4 1 9 7 5 20 11 2"},"note":"Le sous-arbre gauche de 2 est terminé : on affiche 2, le dernier.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{"A":2},"visites":[3,1,6,4,0,7,5,8],"courant":2}},
    {"ligne":null,"note":"Fin : tous les nœuds sont visités, la sortie est 12 4 1 9 7 5 20 11 2.","schema":{"type":"arbre","noeuds":[{"v":"7","g":1,"d":2},{"v":"4","g":3,"d":4},{"v":"2","g":5,"d":null},{"v":"12","g":null,"d":null},{"v":"9","g":6,"d":null},{"v":"20","g":7,"d":8},{"v":"1","g":null,"d":null},{"v":"5","g":null,"d":null},{"v":"11","g":null,"d":null}],"pointeurs":{},"visites":[3,1,6,4,0,7,5,8,2],"courant":null}}
  ]
}
```

### 3. Coût : n ou h ?
- On visite **tous** les nœuds (compter, afficher, chercher sans pouvoir s'arrêter) → coût **n** (nombre de nœuds).
- On ne suit **qu'une branche** (on choisit gauche OU droite) → coût ≤ **h + 1** nœuds (hauteur).

## Questions de vérification
1. Quelle est la hauteur de l'arbre vide ? de l'arbre réduit à sa racine ?
2. Combien de branches a un arbre ? (indice : lien avec les feuilles)
3. Différence entre longueur de cheminement et longueur de cheminement externe ?
4. Donner les 4 parcours de l'arbre ci-dessus sans regarder.
5. Un parcours qui s'arrête dès qu'il trouve une valeur : quel coût dans le pire cas ?
