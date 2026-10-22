# TP — Exercices : terminal, droits, filtres et scripts, en bref

**Méthode** : pour chaque consigne, identifier le bon outil (ls/find pour les fichiers, chmod/umask pour les droits, redirections pour les flux, grep/sed/awk pour le texte, un script pour automatiser) puis vérifier le résultat.

| Notion | À retenir |
|---|---|
| exercices-terminal | `mkdir -p a/b/c`, `cp a* A/`, `mv A autres/`, `rm -r autres`. |
| exercices-terminal | `find . -name`, `-type f`, `-type d`, `-size +1M`, `-size -50c`, `-o` entre parenthèses échappées. |
| exercices-permissions | `chmod 600`, `640`, `u+x` ; pour supprimer, il faut w et x sur le répertoire. |
| exercices-permissions | `umask 022` → 755/644 ; `umask 077` → 700/600 ; `umask 002` → 775/664. |
| exercices-redirections | `> f` écrase, `>> f` ajoute, `2> f` erreurs, `2>&1` réunit, `/dev/null` jette. |
| exercices-redirections | `ls /usr/bin \| wc -l` compte ; `find ... \| wc -l` compte par critère. |
| exercices-redirections | Un binaire du répertoire courant se lance par ./nom, ou après ajout au PATH. |
| exercices-filtres | grep : `^`, `$`, classes, `-E` pour `\|` `+` `?`, `-i` casse, `-l` fichiers, `-c` compte. |
| exercices-filtres | sed : `s///g`, `/motif/d`, `-n ...p`, `-i` ; ordre des commandes significatif. |
| exercices-filtres | Athletes : `$7` Team, `$10` Year, `$11` Season, `$15` Medal. |
| exercices-awk | `FS="[,;]"` puis `$2 == 0`, `$2 > .9 && $3 > .9`, `$1 !~ /^(Dark\|Medium)/`. |
| exercices-awk | Compter : `{ nb++ }` dans la section principale, `END{ print nb }`. |
| exercices-scripts | Vérifier `$#`, message sur `1>&2`, `exit 1`, guillemets, `while` + `shift`. |
| exercices-scripts | `[ -f f ] && cp f f.old`, `$RANDOM` pour renommer, `diff -q` pour les doublons. |

**Réflexe** : une consigne « supprimer / copier / déplacer selon un motif » se règle d'abord par globbing ou `find`, pas par un script.
