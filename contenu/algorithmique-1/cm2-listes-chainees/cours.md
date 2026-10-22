# CM 2 — Pointeurs, structures récursives et listes chaînées

> **Info :** Annale 2024-2025 : 6 pts (listes chaînées)
> Redéfinir `structure noeud` + `type liste`, parcours, coût, **construction d'une nouvelle liste filtrée en récursif ET en itératif** (patron tête/queue).

## À savoir faire
- Définir une Structure (enregistrement) et utiliser la notation pointée.
- Distinguer **copie d'adresse** et **copie de valeur** avec des pointeurs.
- Utiliser `Nouveau(type)` / `désallouer(p)` → Allocation dynamique.
- Écrire la Structure récursive `noeud` et le type `liste` **de mémoire**.
- Parcourir, afficher, copier, inverser une Liste chaînée (récursif + itératif).
- Construire une nouvelle liste **dans l'ordre** en itératif → Construire une liste en sortie.
- Supprimer le dernier nœud **sans bug** (s'arrêter sur l'avant-dernier).

## L'essentiel

### 1. La définition à connaître par cœur
```text
structure noeud
  valeur : entier
  suivant : pointeur sur noeud

type liste = pointeur sur noeud      // alias : liste ≡ pointeur sur noeud
```
- Liste vide = `None`. Le dernier nœud a `suivant = None`.
- `p->valeur` est un raccourci pour `p->.valeur`.

![liste chainee](img/algo-liste-chainee.svg)

### 2. Copie d'adresse ≠ copie de valeur (piège classique)
```text
A = Nouveau(entier) ; A-> = 12
B = A                               // B pointe sur le MÊME objet
C = Nouveau(entier) ; C-> = A->     // C a son propre objet
A-> = 5
afficher A->, B->, C->              // 5 5 12
```
![copie adresse valeur](img/algo-copie-adresse-valeur.svg)
> Conséquence directe : dans TD2 - Listes chaînées Q3, `P = L` puis `P->suivant->valeur = 8` **modifie L**.

### 3. Les opérations de base (versions sûres)

**Insertion en début — O(1)**
```text
insertionDebut(L : liste, n : entier) : liste
  tmp : liste ; tmp = Nouveau(noeud)
  tmp->valeur = n
  tmp->suivant = L
  retourner tmp
```
> Construire 5,7,9 par insertions en début : insérer **9 puis 7 puis 5** (l'ordre s'inverse).

**À toi de jouer — insertion en début, pas à pas** (clique sur « Suivant », ou utilise les flèches du clavier)
```pas-a-pas
{
  "titre": "insertionDebut(L, 5) sur la liste 7 → 9",
  "code": [
    "insertionDebut(L : liste, n : entier) : liste",
    "  tmp : liste ; tmp = Nouveau(noeud)",
    "  tmp->valeur = n",
    "  tmp->suivant = L",
    "  retourner tmp"
  ],
  "etapes": [
    { "ligne": 0, "vars": { "n": 5 }, "note": "On reçoit L, qui pointe sur le nœud 7. On veut ajouter 5 en tête.",
      "schema": { "type": "liste", "noeuds": [ { "v": "7", "suivant": 1 }, { "v": "9", "suivant": null } ], "pointeurs": { "L": 0 } } },
    { "ligne": 1, "note": "Nouveau(noeud) crée un nœud isolé : sa valeur n'est pas encore définie, il n'est relié à rien.",
      "schema": { "type": "liste", "noeuds": [ { "v": "?", "suivant": null }, { "v": "7", "suivant": 2 }, { "v": "9", "suivant": null } ], "pointeurs": { "tmp": 0, "L": 1 } } },
    { "ligne": 2, "note": "On range la valeur 5 dans le nouveau nœud.",
      "schema": { "type": "liste", "noeuds": [ { "v": "5", "suivant": null }, { "v": "7", "suivant": 2 }, { "v": "9", "suivant": null } ], "pointeurs": { "tmp": 0, "L": 1 } } },
    { "ligne": 3, "note": "tmp->suivant = L : le nouveau nœud pointe sur l'ancienne tête. La liste est maintenant 5 → 7 → 9.",
      "schema": { "type": "liste", "noeuds": [ { "v": "5", "suivant": 1 }, { "v": "7", "suivant": 2 }, { "v": "9", "suivant": null } ], "pointeurs": { "tmp": 0, "L": 1 } } },
    { "ligne": 4, "note": "On retourne tmp : c'est la nouvelle tête. L'appelant doit récupérer ce retour, sinon il garde l'ancienne liste.",
      "schema": { "type": "liste", "noeuds": [ { "v": "5", "suivant": 1 }, { "v": "7", "suivant": 2 }, { "v": "9", "suivant": null } ], "pointeurs": { "tmp": 0 } } }
  ]
}
```

**Copie récursive** (le patron le plus utile à l'examen)
```text
copieListeRec(L : liste) : liste
  si L = None alors retourner None
  res : liste ; res = Nouveau(noeud)
  res->valeur = L->valeur
  res->suivant = copieListeRec(L->suivant)
  retourner res
```

**Copie itérative** — patron tête/queue (⚠️ la version du diaporama oublie d'affecter `res`, voici la version correcte)
```text
copieListeIt(L : liste) : liste
  si L = None alors retourner None
  res, queue : liste
  res = Nouveau(noeud) ; res->valeur = L->valeur ; res->suivant = None
  queue = res                          // queue = dernier nœud de la copie
  L = L->suivant
  tant que L <> None faire
    queue->suivant = Nouveau(noeud)
    queue = queue->suivant
    queue->valeur = L->valeur ; queue->suivant = None
    L = L->suivant
  retourner res
```


**À toi de jouer — `copieListeIt` pas à pas** : copie de la liste 5 → 7 (patron tête/queue)
```pas-a-pas
{
  "titre": "copieListeIt(L) sur la liste 5 → 7",
  "code": [
    "copieListeIt(L : liste) : liste",
    "  si L = None alors retourner None",
    "  res, queue : liste",
    "  res = Nouveau(noeud) ; res->valeur = L->valeur ; res->suivant = None",
    "  queue = res",
    "  L = L->suivant",
    "  tant que L <> None faire",
    "    queue->suivant = Nouveau(noeud)",
    "    queue = queue->suivant",
    "    queue->valeur = L->valeur ; queue->suivant = None",
    "    L = L->suivant",
    "  retourner res"
  ],
  "etapes": [
    {"ligne":0,"note":"On recopie la liste 5 → 7 dans une nouvelle liste, sans partager aucun nœud.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null}],"pointeurs":{"L":0}}},
    {"ligne":1,"note":"L n'est pas vide : on continue."},
    {"ligne":3,"note":"On crée le premier nœud de la copie, avec la valeur du premier nœud de L.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":null}],"pointeurs":{"L":0,"res":2}}},
    {"ligne":4,"note":"queue désigne toujours le dernier nœud de la copie : c'est là qu'on ajoutera la suite.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":null}],"pointeurs":{"L":0,"res":2,"queue":2}}},
    {"ligne":5,"note":"L avance sur le deuxième nœud de la liste d'origine.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":null}],"pointeurs":{"L":1,"res":2,"queue":2}}},
    {"ligne":6,"note":"L pointe sur 7, donc différent de None : on entre dans la boucle."},
    {"ligne":7,"note":"On accroche un nouveau nœud derrière le dernier de la copie.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":3},{"v":"?","suivant":null}],"pointeurs":{"L":1,"res":2,"queue":2}}},
    {"ligne":8,"note":"queue avance sur ce nouveau nœud : il devient le dernier de la copie.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":3},{"v":"?","suivant":null}],"pointeurs":{"L":1,"res":2,"queue":3}}},
    {"ligne":9,"note":"On copie la valeur 7 et on termine la copie par None.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":3},{"v":"7","suivant":null}],"pointeurs":{"L":1,"res":2,"queue":3}}},
    {"ligne":10,"note":"L avance : il n'y a plus de nœud dans la liste d'origine, L vaut None.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":3},{"v":"7","suivant":null}],"pointeurs":{"L":null,"res":2,"queue":3}}},
    {"ligne":6,"note":"L = None : la boucle s'arrête."},
    {"ligne":11,"note":"On retourne res : la copie 5 → 7 est une liste à part, modifier l'une ne change pas l'autre.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null},{"v":"5","suivant":3},{"v":"7","suivant":null}],"pointeurs":{"res":2}}}
  ]
}
```

**Inversion (copie à l'envers)** : insérer en début un à un → voir Inversion d'une liste.

**Suppression du dernier nœud — O(n)** (⚠️ la version du diaporama ne remet pas l'avant-dernier à `None` : il faut s'arrêter sur l'**avant-dernier**)
```text
suppressionFin(L : liste) : liste
  si L = None alors retourner None
  si L->suivant = None alors            // un seul nœud
    désallouer(L) ; retourner None
  tmp : liste ; tmp = L
  tant que tmp->suivant->suivant <> None faire
    tmp = tmp->suivant                  // tmp = avant-dernier
  désallouer(tmp->suivant)
  tmp->suivant = None
  retourner L
```


**À toi de jouer — `suppressionFin` pas à pas** : suppression du dernier nœud de 5 → 7 → 9 (il faut s'arrêter sur l'**avant-dernier**)
```pas-a-pas
{
  "titre": "suppressionFin(L) sur la liste 5 → 7 → 9",
  "code": [
    "suppressionFin(L : liste) : liste",
    "  si L = None alors retourner None",
    "  si L->suivant = None alors",
    "    désallouer(L) ; retourner None",
    "  tmp : liste ; tmp = L",
    "  tant que tmp->suivant->suivant <> None faire",
    "    tmp = tmp->suivant",
    "  désallouer(tmp->suivant)",
    "  tmp->suivant = None",
    "  retourner L"
  ],
  "etapes": [
    {"ligne":0,"note":"On veut supprimer le dernier nœud, celui qui contient 9.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":2},{"v":"9","suivant":null}],"pointeurs":{"L":0}}},
    {"ligne":1,"note":"La liste n'est pas vide."},
    {"ligne":2,"note":"L->suivant n'est pas None : il y a au moins deux nœuds, on ne traite pas le cas du nœud seul."},
    {"ligne":4,"note":"tmp part du premier nœud.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":2},{"v":"9","suivant":null}],"pointeurs":{"L":0,"tmp":0}}},
    {"ligne":5,"note":"tmp->suivant->suivant est le nœud 9 : différent de None, on avance."},
    {"ligne":6,"note":"tmp avance sur le nœud 7.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":2},{"v":"9","suivant":null}],"pointeurs":{"L":0,"tmp":1}}},
    {"ligne":5,"note":"tmp->suivant->suivant vaut None : on s'arrête. tmp est sur l'avant-dernier nœud, c'est le but."},
    {"ligne":7,"note":"On libère le nœud 9 (✗). Attention : tmp->suivant pointe encore dessus, il ne faut plus s'en servir.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":2},{"v":"✗","suivant":null}],"pointeurs":{"L":0,"tmp":1}}},
    {"ligne":8,"note":"On referme la liste : 7 devient le dernier nœud. Sans cette ligne, la liste pointerait sur un nœud libéré.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null}],"pointeurs":{"L":0,"tmp":1}}},
    {"ligne":9,"note":"On retourne L : la liste est maintenant 5 → 7.","schema":{"type":"liste","noeuds":[{"v":"5","suivant":1},{"v":"7","suivant":null}],"pointeurs":{"L":0}}}
  ]
}
```

### 4. Réflexe « tous les cas »
Pour toute procédure sur liste, vérifier : **liste vide**, **un seul nœud**, élément **absent**, élément **en tête**, élément **en fin**.

## Questions de vérification
1. Que contient la variable `N` si `N : pointeur sur entier` ? Et `N->` ?
2. Pourquoi écrire `R-> = 3.21` sans `Nouveau` est une erreur ?
3. Pourquoi une procédure qui modifie la liste doit-elle **retourner** la liste ?
4. Pourquoi la première tentative de `suppressionFin` ne fait rien ?
5. Coût de l'insertion en début ? en fin ?
