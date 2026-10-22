# CM3 — Expressions régulières, grep, sed et awk, en bref

**Méthode** : une regexp décrit un motif (ancres, classes, multiplicateurs) ; `grep` sélectionne des lignes, `sed` édite un flux ligne par ligne, `awk` découpe chaque ligne en champs et la traite.

| Notion | À retenir |
|---|---|
| expressions-regulieres | `^` début, `$` fin, `.` un caractère, `[...]` une classe, `[^...]` le complément. |
| expressions-regulieres | `*` 0..n, `+` 1..n, `?` 0 ou 1, `{n,m}` entre n et m occurrences. |
| expressions-regulieres | `+`, `?`, `\|` sont des ERE : option `-E` pour grep, `-E`/`-r` pour sed. |
| groupes-captures | `\(...\)` capture un groupe, `\1`, `\2`… le rappellent dans l'ordre. |
| groupes-captures | `\b` délimite un mot ; `([a-z]).{1}\1` = trois caractères en miroir. |
| grep | Garde les lignes qui contiennent le motif ; pas de slash autour du motif. |
| grep | `-i` casse, `-c` compte, `-n` numérote, `-l` noms de fichiers, `-v` inverse. |
| grep | `motif1\|motif2` = ou (avec -E) ; plusieurs motifs = filtrages successifs par pipes. |
| sed-substitution | `s/motif/remplacement/flag` ; flag `g` = toutes les occurrences. |
| sed-substitution | Sans `-i`, sed n'affiche que le résultat ; `-i` modifie le fichier. |
| sed-substitution | Les commandes s'enchaînent : `s/a/b/;s/b/c/` donne ccccc sur aabac. |
| sed-effacement | `/motif/d` supprime les lignes qui contiennent le motif, `!d` l'inverse. |
| sed-effacement | `1d`, `2,5d`, `$d`, `-n 5000p` agissent sur les numéros de ligne du flux entier. |
| sed-effacement | Script long : fichier `.sed` puis `sed -f script.sed fichier`. |
| awk-champs | `$0` ligne, `$1`… champs, `$NF` dernier, `NF` nombre de champs, `FS` séparateur. |
| awk-champs | `-F','` ou `BEGIN{FS=","}` pour un CSV ; `print $2, $4` affiche des champs. |
| awk-sections | `BEGIN` avant les données, section principale par ligne, `END` après la dernière. |
| awk-sections | Une règle = `condition { traitements }` ; `NR` depuis le début, `FNR` par fichier. |
| awk-sections | `awk -f script.awk fichier` ; un paramètre exige `ARGC--` dans BEGIN. |

**Piège central** : sans `-E`, `+` et `?` sont littéraux ; et sans `-i`, `sed` ne modifie rien.
