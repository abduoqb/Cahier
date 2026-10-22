# CM 1 — Langage algorithmique et tableaux

> **Info :** Annale 2024-2025 : 5,5 pts (tableaux)
> `echange` + **trace d'un tri à bulles** + **coût meilleur/pire des cas**.

## À savoir faire
- Écrire une procédure propre en Langage algorithmique (signature typée, indentation, `retourner`).
- Expliquer le Passage par valeur (et pourquoi un tableau/pointeur, lui, peut être modifié).
- Écrire une version **récursive** et **itérative** d'un même calcul → Récursivité, Récursivité terminale.
- Parcourir un tableau : parcours complet vs parcours avec arrêt → Recherche séquentielle.
- Insérer / supprimer dans un Tableau contigu (décalages).
- **Calculer un coût** (nombre d'accès / comparaisons) dans le meilleur et le pire des cas → Complexité.
- Tracer l'exécution d'un tri (Tri à bulles, Tri par insertion).

## L'essentiel

### 1. Le pseudo-langage (ce que le correcteur attend)
| Élément | Syntaxe |
|---|---|
| Déclaration | `a : entier ; mot : chaîne de caractères` |
| Affectation | `a = 10` (affectation parallèle : `a, b = b, a`) |
| Condition | `si ... alors ... sinon ...` (indentation = bloc) |
| Boucles | `tant que ... faire`, `répéter ... jusqu'à ...`, `pour i de a à b (par pas de j) faire` |
| Procédure | `nom(x : entier, tab : tableau d'entiers)` — ne retourne rien |
| Fonction | `nom(x : entier) : entier` + `retourner ...` |
| Tableau | `tab[1000] : tableau d'entiers` — cases 0 à n−1, `tailleMax` = constante |

> **Astuce :** Le prof note aussi la **lisibilité** : noms significatifs, commentaires `//`, méthode simple. Un code qui « marche » mais illisible perd des points.

### 2. Récursif ↔ itératif
```text
factorielleRec(n : entier) : entier          factorielleIt(n : entier) : entier
  si n = 0 ou n = 1 alors                       res : entier ; res = 1
    retourner 1          // cas terminal        pour i de 2 à n faire
  retourner n * factorielleRec(n-1)               res = res * i
                                                retourner res
```
- **Structures linéaires** (tableaux, listes) → l'itératif est souvent plus naturel.
- **Structures arborescentes** (arbres, forêts) → le récursif est plus naturel (l'itératif demande une Pile ou une File).
- À l'examen : **respecter la consigne** (« récursive » / « itérative ») ; sinon, libre choix.

### 3. Deux patrons de parcours de tableau
```text
maxTableau(tab, n) : entier            premierZero(tab, n) : entier
  indice_maxi = 0 ; maxi = tab[0]        i : entier ; i = 0
  pour i de 1 à n-1 faire                tant que i < n et tab[i] <> 0 faire
    si tab[i] > maxi alors                 i = i + 1
      maxi = tab[i] ; indice_maxi = i    si i = n alors retourner -1
  retourner indice_maxi                  retourner i
```
- Parcours **complet** (`pour`) : coût = n, **toujours**.
- Parcours **avec arrêt** (`tant que` + condition) : coût entre 1 et n → il y a un meilleur et un pire cas.

**À toi de jouer — `maxTableau` pas à pas** sur `tab = [4, 9, 2, 7]` avec `n = 4`
```pas-a-pas
{
  "titre": "maxTableau(tab, 4) sur [4, 9, 2, 7]",
  "code": [
    "indice_maxi = 0 ; maxi = tab[0]",
    "pour i de 1 à n-1 faire",
    "  si tab[i] > maxi alors",
    "    maxi = tab[i] ; indice_maxi = i",
    "retourner indice_maxi"
  ],
  "etapes": [
    { "ligne": 0, "vars": { "n": 4, "indice_maxi": 0, "maxi": 4 }, "note": "On part du principe que la case 0 contient le maximum : maxi = 4.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": {}, "surligne": [0] } },
    { "ligne": 1, "vars": { "i": 1 }, "note": "La boucle commence à i = 1 : la case 0 est déjà prise en compte.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 1 }, "surligne": [0] } },
    { "ligne": 2, "note": "tab[1] = 9 est-il plus grand que maxi = 4 ? Oui.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 1 }, "surligne": [0, 1] } },
    { "ligne": 3, "vars": { "maxi": 9, "indice_maxi": 1 }, "note": "On retient la valeur 9 et sa position 1.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 1 }, "surligne": [1] } },
    { "ligne": 1, "vars": { "i": 2 },
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 2 }, "surligne": [1] } },
    { "ligne": 2, "note": "tab[2] = 2 est-il plus grand que maxi = 9 ? Non : rien ne change.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 2 }, "surligne": [1, 2] } },
    { "ligne": 1, "vars": { "i": 3 },
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 3 }, "surligne": [1] } },
    { "ligne": 2, "note": "tab[3] = 7 est-il plus grand que maxi = 9 ? Non : rien ne change.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": { "i": 3 }, "surligne": [1, 3] } },
    { "ligne": 4, "note": "La boucle est finie : on retourne l'indice 1. Le parcours est complet, il coûte toujours n accès.",
      "schema": { "type": "tableau", "cases": [4, 9, 2, 7], "marques": {}, "fixes": [1] } }
  ]
}
```

> **Attention :** Ordre des conditions : `i < n et tab[i] <> 0` — on teste l'indice **avant** d'accéder à la case (évaluation paresseuse du `et`).

**À toi de jouer — `premierZero` pas à pas** sur `tab = [3, 5, 0, 8]` avec `n = 4` (parcours avec arrêt)
```pas-a-pas
{
  "titre": "premierZero(tab, 4) sur [3, 5, 0, 8]",
  "code": [
    "premierZero(tab, n) : entier",
    "  i : entier ; i = 0",
    "  tant que i < n et tab[i] <> 0 faire",
    "    i = i + 1",
    "  si i = n alors retourner -1",
    "  retourner i"
  ],
  "etapes": [
    {"ligne":0,"vars":{"n":4},"note":"On cherche la position du premier 0 dans le tableau.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{}}},
    {"ligne":1,"vars":{"i":0},"note":"On part de la case 0.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":0}}},
    {"ligne":2,"note":"i < n et tab[0] = 3 est différent de 0 : on continue.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":0},"surligne":[0]}},
    {"ligne":3,"vars":{"i":1},"schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":1}}},
    {"ligne":2,"note":"i < n et tab[1] = 5 est différent de 0 : on continue.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":1},"surligne":[1]}},
    {"ligne":3,"vars":{"i":2},"schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":2}}},
    {"ligne":2,"note":"tab[2] = 0 : la condition devient fausse, la boucle s'arrête. La case 3 n'est jamais lue.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":2},"surligne":[2]}},
    {"ligne":4,"note":"i vaut 2, pas n : le 0 a été trouvé.","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{"i":2}}},
    {"ligne":5,"note":"On retourne 2. Parcours avec arrêt : ici 3 cases lues sur 4, le coût dépend des données (meilleur et pire cas).","schema":{"type":"tableau","cases":[3,5,0,8],"marques":{},"fixes":[2]}}
  ]
}
```

### 4. Tableau contigu : insertion / suppression
Voir Tableau contigu (schéma des décalages). Insertion en position k = décaler **à droite de la fin vers k** ; suppression = décaler **à gauche de k+1 vers la fin**. Coût = nombre de décalages = `taille − k` au pire ≈ n.

## Questions de vérification
1. Que vaut `m` après `afficher pluscinq(m)` si `m = 3` ? Pourquoi ?
2. Qu'est-ce qui distingue une récursivité terminale d'une non terminale ? À quoi sert l'accumulateur ?
3. Pourquoi l'insertion dans un tableau contigu décale-t-elle de la **fin** vers k et pas l'inverse ?
4. Coût de `premierZero` dans le meilleur et le pire cas ? Donner un exemple de chaque.
5. Quelle différence entre `tailleMax` et `taille` ?
