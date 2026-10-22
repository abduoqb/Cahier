# CM4 — Scripts bash, en bref

**Méthode** : un script est un fichier exécutable commençant par `#!/bin/bash` ; on y met des variables, des tests, des boucles et on lit les arguments avec `shift`.

| Notion | À retenir |
|---|---|
| script-shell | Première ligne `#!/bin/bash` (shebang) ; extension .sh ; `#` = commentaire. |
| script-shell | `sh script.sh` marche sans droit x ; `./script.sh` exige `chmod u+x`. |
| script-shell | echo écrit sur la sortie standard ; $$ pid, $PPID parent, $USER, $HOME, $PATH, $PWD. |
| variables-shell | `nom=valeur` sans espaces ; lecture avec `$nom` ; concaténation par juxtaposition. |
| variables-shell | `i=$i+4` est faux ; utiliser `(( i = i + 4 ))`, `i=$(( i + 4 ))` ou `expr`. |
| variables-shell | `$(commande)` récupère la sortie standard, pas le code de retour (qui est `$?`). |
| tests | `test`, `[ ]`, `(( ))` pour les nombres, les doubles crochets pour les chaînes et fichiers. |
| tests | `-eq -ne -lt -le -gt -ge` nombres ; `-z -n`, `=` `!=` chaînes ; `-e -x -d -w` fichiers. |
| tests | `$?` vaut 0 si le test est vrai, 1 s'il est faux (0 = succès de la commande). |
| structures-controle | `if ... then ... elif ... else ... fi` ; `for x in liste; do ... done`. |
| structures-controle | `while test; do ... done` ; `case ... in motif) ... ;; esac` avec `*)` par défaut. |
| structures-controle | `(( ))` et les doubles crochets s'utilisent directement comme condition d'un if. |
| globbing-expansion | `*` et `?` sont interprétés par bash : `for f in *.sh` suffit. |
| globbing-expansion | `{1..6}` et `{a-d}` énumèrent ; `seq` génère une séquence. |
| arguments-shift | `$1` premier argument, `$0` script, `$#` nombre, `$@` tous les arguments. |
| arguments-shift | `shift` décale les arguments : indispensable pour garder les espaces et les arguments vides. |
| arguments-shift | Vérifier `$#` puis `echo usage 1>&2` et `exit 1` en cas d'erreur. |

**Piège central** : `$?` se lit à l'envers de l'intuition (0 = vrai/succès), et `for in $@` perd les espaces.
