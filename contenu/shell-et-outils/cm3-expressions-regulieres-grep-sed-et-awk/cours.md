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

**Aide-mémoire des feuilles de cours** (testé avec `grep -E` et `sed -E` de GNU) :

| Notation | Sens | Remarque |
|---|---|---|
| `[:alpha:]`, `[:digit:]`, `[:alnum:]`, `[:upper:]`, `[:lower:]`, `[:space:]`, `[:punct:]` | classes POSIX | s'écrivent dans des crochets : `[[:digit:]]+` |
| `\w`, `\W` | caractère de mot (lettre, chiffre, `_`) / son contraire | extension GNU, marche avec `grep -E` |
| `\s`, `\S` | espace, tabulation… / son contraire | extension GNU |
| `\b`, `\B` | limite de mot / pas une limite de mot | extension GNU |
| `\d` | un chiffre | **n'existe pas en POSIX** : `grep -E '\d'` cherche la lettre d. Écrire `[0-9]` ou `[[:digit:]]` |
| `*?`, `+?`, `(?=...)` | non gourmand, lookahead | réservés à PCRE (`grep -P`, Perl, Python) ; en ERE, `.*` prend le plus long (`<.*>` sur `<a><b>` donne `<a><b>`) |
| `\.`, `\\`, `\$`, `\[` | caractère spécial pris au sens littéral | on l'échappe avec `\` |
| `&` dans un remplacement `sed` | tout le texte trouvé | `echo hello \| sed 's/l/[&]/g'` donne `he[l][l]o` |
| `\U`, `\L`, `\u`, `\l` dans un remplacement | majuscules / minuscules (GNU `sed`) | `echo hello \| sed 's/.*/\U&/'` donne `HELLO` |

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

```pas-a-pas
{
  "titre": "sed 's/a/b/g;s/b/c/g' : les commandes s'enchaînent",
  "code": [
    "echo \"aabac\" | sed 's/a/b/g;s/b/c/g'",
    "  s/a/b/g   # 1re commande",
    "  s/b/c/g   # 2e commande"
  ],
  "etapes": [
    {"ligne":0,"vars":{"ligne lue":"aabac"},"note":"sed lit la ligne aabac et lui applique ses commandes dans l'ordre, l'une après l'autre."},
    {"ligne":1,"vars":{"ligne lue":"bbbbc"},"note":"Première commande : tous les a deviennent b. Il y a maintenant quatre b."},
    {"ligne":2,"vars":{"ligne lue":"ccccc"},"note":"Deuxième commande : elle s'applique au résultat de la première, donc TOUS les b (ceux d'origine et les nouveaux) deviennent c."},
    {"ligne":null,"note":"Résultat affiché : ccccc. La seconde commande ne voit pas le texte d'origine, elle voit la sortie de la première."}
  ]
}
```

```pas-a-pas
{
  "titre": "sed 's/b/c/g;s/a/b/g' : l'ordre inverse",
  "code": [
    "echo \"aabac\" | sed 's/b/c/g;s/a/b/g'",
    "  s/b/c/g   # 1re commande",
    "  s/a/b/g   # 2e commande"
  ],
  "etapes": [
    {"ligne":0,"vars":{"ligne lue":"aabac"},"note":"Même texte, mêmes deux commandes, mais dans l'autre ordre."},
    {"ligne":1,"vars":{"ligne lue":"aacac"},"note":"Le seul b devient c."},
    {"ligne":2,"vars":{"ligne lue":"bbcbc"},"note":"Les a deviennent b : les b créés ne sont plus touchés puisque la commande qui change les b est déjà passée."},
    {"ligne":null,"note":"Résultat : bbcbc, différent de ccccc. L'ordre des commandes sed compte."}
  ]
}
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

```pas-a-pas
{
  "titre": "awk : BEGIN, section principale et END sur un petit CSV",
  "code": [
    "BEGIN { FS = \",\" }",
    "NR > 1 { somme += $2 ; n++ }",
    "END { print somme / n }"
  ],
  "etapes": [
    {"ligne":0,"vars":{"FS":",","somme":0,"n":0},"note":"Fichier lu : « Nom,Age » puis « Ana,24 », « Bob,30 », « Cid,18 ». BEGIN s'exécute une seule fois, avant la première ligne."},
    {"ligne":1,"vars":{"NR":1,"$0":"Nom,Age","$2":"Age"},"note":"Ligne 1, l'en-tête : NR > 1 est faux, la règle est ignorée. C'est le rôle de cette condition."},
    {"ligne":1,"vars":{"NR":2,"$0":"Ana,24","$2":24,"somme":24,"n":1},"note":"Ligne 2 : la condition est vraie, on ajoute le deuxième champ à somme et on compte la ligne."},
    {"ligne":1,"vars":{"NR":3,"$0":"Bob,30","$2":30,"somme":54,"n":2},"note":"Ligne 3 : même règle."},
    {"ligne":1,"vars":{"NR":4,"$0":"Cid,18","$2":18,"somme":72,"n":3},"note":"Ligne 4 : somme = 72, n = 3."},
    {"ligne":2,"vars":{"affichage":24},"note":"Toutes les lignes sont lues : END s'exécute une seule fois et affiche 72 / 3 = 24."}
  ]
}
```

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
- Laisser `FS` à l'espace sur un CSV : toute la ligne devient `$1` (s'il n'y a pas d'espace dedans), `$NF` vaut la ligne entière.
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
