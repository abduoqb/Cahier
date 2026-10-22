# CM 3 — Expressions régulières, grep, sed et awk

> **Info :** Sources : CM3-4 « Filtrage et traitement de flux », TP5 (awk, fichier Athletes.csv) et TP « Expressions régulières et commande grep ».

## À savoir faire
- Lire et écrire une expression régulière POSIX : ancres, classes, multiplicateurs.
- Capturer un groupe et le rappeler avec `\1`, `\2`…
- Filtrer des lignes avec `grep` et ses options usuelles.
- Remplacer, supprimer ou extraire des lignes avec `sed`.
- Traiter des fichiers de champs avec `awk` : `$1`, `$NF`, `NF`, `FS`, `NR`.
- Structurer un programme `awk` en sections `BEGIN`, principale et `END`.

## L'essentiel

### 1. Expression régulière : le vocabulaire POSIX
Une **expression régulière** décrit tout un ensemble de chaînes grâce à des caractères particuliers. On l'écrit souvent entre slashs : `/regexp/` (mais `grep` n'en a pas besoin).

| Catégorie | Caractère | Signification |
|---|---|---|
| ancres | `^` | début de ligne |
| | `$` | fin de ligne |
| classes | `[aeiouy]` | un caractère parmi a, e, i, o, u, y |
| | `[^aeiouy]` | un caractère **autre que** ceux-là |
| | `[c-r]`, `[0-9]` | un caractère dans l'intervalle |
| | `[:lower:]`, `[:upper:]` | une minuscule, une majuscule |
| | `.` | un caractère quelconque sauf le passage à la ligne |
| multiplicateurs | `*` | 0, 1 ou plusieurs occurrences du précédent |
| | `+` | au moins une occurrence |
| | `?` | 0 ou 1 occurrence |
| | `{n,m}` | entre n et m occurrences |

Exemples classiques :
```text
téléphone : /^\+?[1-9][0-9]{7,14}$/
date      : /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/
email     : /^\S+@\S+\.\S+$/
```
POSIX distingue les expressions **de base** et **étendues** (ERE). `+`, `?`, `|` font partie des ERE : pour les utiliser avec `grep` ou `sed`, il faut l'option `-E` (ou `-r` pour `sed`).

### 2. Groupes de captures et références arrière
On capture un caractère ou un groupe avec `\(...\)` et on le rappelle ensuite par `\1`, `\2`… dans l'ordre des groupes.

- `/([a-z]).{1}\1/` : trois caractères dont le premier et le dernier sont identiques, séparés par exactement un caractère. `alarme`, `tata`, `toto`, `ara` contiennent un tel motif.
- `/\b([a-z]).{1}\1\b/` : un **mot** de trois caractères en miroir. Ici `\b` délimite le mot : parmi les exemples, seul `ara` convient.
- `/\b([a-z])([a-z]).{1}\2\1\b/` : mot miroir de taille 5 (`radar`, `abcba`).
- `/\b([a-z]{2}).{1}\1\b/` : le bloc des deux premiers caractères se répète à la fin (`abcab`, mais pas `radar`).

Attention : `(...)` capture un groupe, `(...)(...)` capture plusieurs groupes distincts, dans l'ordre de lecture.

### 3. grep : filtrer des lignes
```bash
grep <options> <regexp> <fichiers>
cat <fichier> | grep <options> <regexp>
```
`grep` garde les lignes qui contiennent le motif. Plusieurs motifs et plusieurs fichiers sont possibles.

| Option | Effet |
|---|---|
| `-E` | expressions régulières étendues |
| `-i` | ignore la casse |
| `-c` | compte les lignes qui correspondent |
| `-n` | affiche le numéro des lignes |
| `-l` | n'affiche que les noms des fichiers concernés |
| `-v` | inverse : lignes qui **ne** contiennent **pas** le motif |

```bash
grep -i "France" athletes.csv                  # France, sans tenir compte de la casse
grep -icE "([a-z]).{1}\1" fichiers.txt         # nombre de lignes avec un mot miroir de taille 3
grep -E "motif1|motif2|motif3" fichier.txt     # l'un ou l'autre (le | est un « ou »)
grep "motif1" f.txt | grep "motif2" | grep "motif3"   # les trois à la fois, par filtrages successifs
```
Le `|` du shell enchaîne des filtres ; dans une expression régulière entre guillemets, `|` veut dire « ou ».

### 4. sed : substitution
```bash
sed <options> <script> <fichier>
sed 's/<motif>/<remplacement>/<flag>' fichier
```
Remplace chaque expression qui corresponde au motif. Le **flag** choisit l'occurrence : `1` la première (défaut), `2` la deuxième, `g` toutes.

```bash
sed 's/a/@/g' fichier        # affiche le fichier en remplaçant tous les a par @
sed -i 's/a/@/g' fichier     # modifie réellement le fichier
sed -E 's/([a-z]+) ([a-z]+)/\2 \1/' f   # échange deux mots (ERE)
```
Les commandes d'un script `sed` s'exécutent **séquentiellement** :
```bash
echo "aabac" | sed 's/a/b/g;s/b/c/g'   # ccccc : les a deviennent b, puis les b deviennent c
echo "aabac" | sed 's/b/c/g;s/a/b/g'   # bbcbc : ordre inverse, résultat différent
```
Groupes de captures avec `sed` (sans `-E`, il faut échapper les parenthèses) :
```bash
sed 's/^..\/\(...\)\/.*/\1/' sample.txt    # garde le mois : Jan
sed 's/.*:\(..\):\(..\):\(..\)/heure \1 minute \2 seconde \3/' sample.txt
```
Pour un script long, on écrit les commandes dans un fichier `.sed` puis `sed -f script.sed fichier`.

### 5. sed : supprimer, filtrer
| Commande | Effet |
|---|---|
| `/<motif>/d` | supprime les lignes contenant le motif |
| `/<motif>/!d` | supprime les lignes qui **ne** contiennent **pas** le motif |
| `<n>d` | supprime la ne ligne |
| `<n>,<m>d` | supprime de la ne à la me ligne |
| `$d` | supprime la dernière ligne |
| `<n>p` | affiche la ne ligne (avec `-n`) |

```bash
sed 1d fichier          # enlever la première ligne
sed 2,5d fichier        # enlever les lignes 2 à 5
sed -n 5000p fichier    # n'afficher que la ligne 5000
sed '/^#/d' copie.txt   # enlever les commentaires Python
sed '/^$/d' copie.txt   # enlever les lignes vides
```
Sur plusieurs fichiers, les numéros de ligne désignent le **flux entier** : `sed 1d f1 f2` supprime seulement la première ligne de `f1`.

### 6. awk : les champs
`awk` traite des lignes composées de **champs** séparés par un séparateur (`FS`, espace par défaut).

| Élément | Sens |
|---|---|
| `$0` | la ligne complète |
| `$1`, `$2`, … | premier, deuxième champ |
| `$NF` | dernier champ |
| `NF` | nombre de champs de la ligne |
| `FS` | séparateur de champs en entrée |
| `OFS` | séparateur de champs en sortie |
| `NR` | numéro de ligne depuis le début |
| `FNR` | numéro de ligne dans le fichier courant |

```bash
awk '/France/{ print }' athletes.csv
awk 'BEGIN{FS=","} NR>1{ print $2, $4, $NF }' athletes.csv
awk -F',' '$3 == "F" { print $1 }' athletes.csv
```
La deuxième commande fixe la virgule comme séparateur, saute l'en-tête (`NR>1`) et affiche nom, âge et dernier champ.

### 7. awk : structure d'un programme
Un programme `awk` est une suite de paires `<condition> { <traitements> }`, encadrées éventuellement par `BEGIN` et `END`.

- **BEGIN** : exécuté une fois avant les données (initialisation : `FS`, `OFS`, compteurs ; `ARGC`, `ARGV`).
- **Section principale** : exécutée pour chaque ligne ; la condition peut porter sur un champ (`$3 ~ /fr/`, `$1 == valeur`, `NR > 2`).
- **END** : exécuté une fois après toutes les entrées (totaux, moyennes).

```awk
#!/bin/awk
BEGIN {
    FS = ","            # séparateur d'entrée
    annee = ARGV[ARGC-1]
    ARGC--              # ne pas traiter l'année comme un fichier de données
    somme = 0; nombre = 0
}
$10 <= annee {
    somme += $4
    nombre++
}
END {
    print "âge moyen :", somme / nombre
}
```
- `awk -f script.awk fichier` exécute un script ; un argument supplémentaire serait pris pour un fichier, d'où le `ARGC--`.
- awk a des variables, des tableaux associatifs (`ages[nom]`, `for (k in tab)`), des fonctions (`function plus(a,b)`), `if`, `for`, `while`, `printf`, `next` (passer à la ligne suivante).
- Pour des traitements orientés caractères plutôt que champs, le cours renvoie vers `perl`.

## Pièges fréquents
- Utiliser `+`, `?` ou `|` sans `-E` : en expression de base, ils sont littéraux.
- Croire que `grep` demande des slashs : `grep /motif/` cherche les slashs eux-mêmes.
- Oublier `-i` et rater les variantes de casse (`France` / `france`).
- Mélanger l'ordre des commandes `sed` : elles s'enchaînent, la sortie de l'une est l'entrée de l'autre.
- Croire que `sed` modifie le fichier : sans `-i`, il affiche seulement le résultat.
- Oublier `-n` avec `p`, qui affiche alors chaque ligne deux fois.
- Laisser `FS` à l'espace sur un CSV : tout le ligne devient `$1`, `$NF` vaut la ligne entière.
- Oublier `NR>1` et traiter la ligne d'en-tête comme une donnée.
- Confondre `NR` (toutes les lignes) et `FNR` (lignes du fichier courant).
- Dans un script `awk` avec paramètre, oublier `ARGC--` : awk essaie d'ouvrir le paramètre comme fichier.
- Utiliser des guillemets doubles autour d'un motif contenant `$` : le shell l'interprète. Les guillemets simples protègent l'expression.

## Questions de vérification
1. Que signifient `^`, `$`, `.`, `*` et `{n,m}` dans une expression régulière ?
2. Pourquoi `grep -E` est-il nécessaire pour `a+` ?
3. Que capture `\(...\)` avec `sed`, et comment le rappelle-t-on dans le remplacement ?
4. Quelle est la différence entre `sed 's/a/b/'` et `sed 's/a/b/g'` ?
5. Comment supprimer les lignes vides d'un fichier avec `sed` ?
6. Que valent `$0`, `$1`, `$NF`, `NF` et `NR` pour une ligne donnée ?
7. À quoi servent les sections `BEGIN` et `END` d'un programme awk ?
