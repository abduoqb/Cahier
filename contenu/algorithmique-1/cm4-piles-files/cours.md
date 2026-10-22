# CM 4 — Piles et files

> **Info :** À retenir
> Utiliser une pile ou une file uniquement par son interface (`fileVide`, `tete`, `defiler`, `enfiler`).
> Les piles servent aussi à **dérécursiver** (lien avec les arbres des CM suivants).

## À savoir faire
- Donner les **5 fonctions d'interface** d'une Pile et d'une File (signatures exactes).
- Expliquer la notion de Type abstrait : on utilise une pile sans connaître son implémentation.
- Implémenter une pile avec un tableau (`P[0]` = nombre d'éléments) et avec une liste chaînée.
- Expliquer pourquoi tableau et liste simple sont **mal adaptés** à une file, et quelle structure choisir.
- Écrire Bon parenthésage (compteur puis pile à 2 types de parenthèses).
- Dérécursiver avec une pile → Pile d'appels.
- Connaître le résultat des Tours de Hanoï : 2ⁿ − 1 déplacements.

## Pile vs file en un coup d'œil

![pile file](img/algo-pile-file.svg)

| | Pile (LIFO) | File (FIFO) |
|---|---|---|
| Créer | `initPile() : pile` | `initFile() : file` |
| Tester | `pileVide(p) : booléen` | `fileVide(f) : booléen` |
| Lire | `sommet(p) : entier` | `tete(f) : entier` |
| Ajouter | `empiler(p, x) : pile` | `enfiler(f, x) : file` |
| Retirer | `depiler(p) : pile` | `defiler(f) : file` |

> ⚠️ `sommet`/`tete`/`depiler`/`defiler` supposent la structure **non vide** : toujours tester `pileVide`/`fileVide` **avant**.

## Implémentations et coûts

| Implémentation | Pile | File |
|---|---|---|
| Tableau (`T[0]` = nb d'éléments) | tout en **O(1)** ✅ (mais capacité max) | `defiler` en **O(n)** (décalage à gauche) ❌ |
| Liste simple (tête = 1er nœud) | tout en **O(1)** ✅ (empiler/dépiler = début) | `enfiler` en **O(n)** (insertion en fin) ❌ |
| Liste à deux pointeurs | — | tout en **O(1)** ✅ |
| Liste circulaire (ptr sur dernier) | — | tout en **O(1)** ✅ |

### Pile avec une liste chaînée (à savoir écrire)
```text
type pile = pointeur sur noeud
initPile() : pile                  retourner None
pileVide(P : pile) : booléen       retourner P = None
sommet(P : pile) : entier          retourner P->valeur
empiler(P : pile, x : entier) : pile
  tmp : pile ; tmp = Nouveau(noeud) ; tmp->valeur = x ; tmp->suivant = P
  retourner tmp
depiler(P : pile) : pile
  tmp : pile ; tmp = P->suivant
  désallouer(P)
  retourner tmp                    // on ne peut pas retourner P->suivant après désallocation
```

### Pile avec un tableau
```text
initPile() : tableau d'entiers
  P[maxPile] : tableau d'entiers ; P[0] = 0 ; retourner P
pileVide(P : tableau d'entiers) : booléen
  retourner P[0] = 0
sommet(P : tableau d'entiers) : entier
  retourner P[P[0]]
empiler(P : tableau d'entiers, x : entier) : tableau d'entiers
  si P[0] < maxPile - 1 alors          // sinon pile pleine : on ne fait rien
    P[0] = P[0] + 1 ; P[P[0]] = x
  retourner P
depiler(P : tableau d'entiers) : tableau d'entiers
  P[0] = P[0] - 1                      // pile supposée non vide
  retourner P
```

**À toi de jouer — `empiler` dans une pile en tableau** (`P[0]` = nombre d'éléments, `maxPile = 5`)
```pas-a-pas
{
  "titre": "empiler(P, 4) avec maxPile = 5, P = [2, 7, 9, –, –]",
  "code": [
    "empiler(P : tableau d'entiers, x : entier) : tableau d'entiers",
    "  si P[0] < maxPile - 1 alors",
    "    P[0] = P[0] + 1 ; P[P[0]] = x",
    "  retourner P"
  ],
  "etapes": [
    {"ligne":0,"vars":{"x":4,"maxPile":5},"note":"P[0] vaut 2 : la pile contient 7 et 9, le sommet est la case P[2].","schema":{"type":"tableau","cases":["2","7","9","–","–"],"marques":{"P[0]":0},"surligne":[0]}},
    {"ligne":1,"note":"P[0] = 2 est inférieur à maxPile - 1 = 4 : il reste de la place. La case 0 ne stocke pas d'élément, d'où le « - 1 ».","schema":{"type":"tableau","cases":["2","7","9","–","–"],"marques":{"P[0]":0},"surligne":[0]}},
    {"ligne":2,"vars":{"P[0]":3},"note":"On incrémente P[0], puis on range x dans la case P[0].","schema":{"type":"tableau","cases":["3","7","9","4","–"],"marques":{"P[0]":0},"surligne":[0,3]}},
    {"ligne":3,"note":"On retourne P : le sommet est maintenant 4, en O(1).","schema":{"type":"tableau","cases":["3","7","9","4","–"],"marques":{"P[0]":0},"fixes":[3]}}
  ]
}
```

## Deux applications de cours
**Bon parenthésage** — voir Bon parenthésage :
```text
bienParenthese(C : chaîne de caractères) : booléen
  P : pile ; P = initPile()
  pour i de 0 à longueur(C) - 1 faire
    si C[i] = '(' alors P = empiler(P, '(')
    si C[i] = ')' alors
      si pileVide(P) alors retourner Faux     // trop de fermantes
      P = depiler(P)
  retourner pileVide(P)                       // sinon trop d'ouvrantes
```

**À toi de jouer — `bienParenthese` pas à pas** sur la chaîne `(()`
```pas-a-pas
{
  "titre": "bienParenthese(\"(()\")",
  "code": [
    "bienParenthese(C : chaîne de caractères) : booléen",
    "  P : pile ; P = initPile()",
    "  pour i de 0 à longueur(C) - 1 faire",
    "    si C[i] = '(' alors P = empiler(P, '(')",
    "    si C[i] = ')' alors",
    "      si pileVide(P) alors retourner Faux",
    "      P = depiler(P)",
    "  retourner pileVide(P)"
  ],
  "etapes": [
    {"ligne":1,"vars":{"P":"vide"},"note":"On part d'une pile vide.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{}}},
    {"ligne":2,"vars":{"i":0},"schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":0}}},
    {"ligne":3,"vars":{"P":"("},"note":"C[0] est une ouvrante : on l'empile.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":0},"surligne":[0]}},
    {"ligne":2,"vars":{"i":1},"schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":1}}},
    {"ligne":3,"vars":{"P":"( ("},"note":"C[1] est une ouvrante : on l'empile aussi.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":1},"surligne":[0,1]}},
    {"ligne":2,"vars":{"i":2},"schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":2}}},
    {"ligne":4,"note":"C[2] est une fermante.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":2},"surligne":[2]}},
    {"ligne":5,"note":"La pile n'est pas vide : il y a bien une ouvrante à fermer, on continue."},
    {"ligne":6,"vars":{"P":"("},"note":"On dépile : une ouvrante est fermée.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{"i":2},"surligne":[1,2]}},
    {"ligne":7,"note":"La boucle est finie mais la pile n'est pas vide : il reste une ouvrante jamais fermée. pileVide(P) vaut Faux, la chaîne est mal parenthésée.","schema":{"type":"tableau","cases":["(","(",")"],"marques":{},"surligne":[0]}}
  ]
}
```
**Tours de Hanoï** — 3 piles, on ne pose jamais un disque sur un plus petit ; solution optimale : **2ⁿ − 1** déplacements (15 pour n = 4).

## Questions de vérification
1. Donner les 5 signatures d'une file.
2. Pourquoi une pile peut-elle être implémentée efficacement par une liste simple mais pas une file ?
3. Avec un tableau, pourquoi la pile contient au plus `maxPile − 1` éléments ?
4. Pourquoi un compteur suffit avec un seul type de parenthèse, mais pas avec deux ?
5. Pour « revenir en arrière » et pour « traiter dans l'ordre d'arrivée », quelle structure choisir ?
