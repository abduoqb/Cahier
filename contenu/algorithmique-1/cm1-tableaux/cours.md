# CM 1 — Langage algorithmique et tableaux

> **Info :** Poids à l'examen : ~5 pts / 20 (exercice « Tableaux » à chaque session)
> Annale 2024-2025 : `echange` + **trace d'un tri à bulles** + **coût meilleur/pire des cas**.

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

> **Attention :** Ordre des conditions : `i < n et tab[i] <> 0` — on teste l'indice **avant** d'accéder à la case (évaluation paresseuse du `et`).

### 4. Tableau contigu : insertion / suppression
Voir Tableau contigu (schéma des décalages). Insertion en position k = décaler **à droite de la fin vers k** ; suppression = décaler **à gauche de k+1 vers la fin**. Coût = nombre de décalages = `taille − k` au pire ≈ n.

## Questions de vérification
1. Que vaut `m` après `afficher pluscinq(m)` si `m = 3` ? Pourquoi ?
2. Qu'est-ce qui distingue une récursivité terminale d'une non terminale ? À quoi sert l'accumulateur ?
3. Pourquoi l'insertion dans un tableau contigu décale-t-elle de la **fin** vers k et pas l'inverse ?
4. Coût de `premierZero` dans le meilleur et le pire cas ? Donner un exemple de chaque.
5. Quelle différence entre `tailleMax` et `taille` ?
