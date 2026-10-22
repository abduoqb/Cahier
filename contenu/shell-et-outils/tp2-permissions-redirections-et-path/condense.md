# TP 2 — Permissions, redirections et PATH, en bref

**Méthode** : on teste chaque changement de droits avec `ls -l`, et chaque redirection en regardant ce qui reste à l'écran.

| Notion | À retenir |
|---|---|
| droits-fichiers | `chmod 600` = `u=rw,go=` ; `640` = `u=rw,g=r,o=` ; `chmod u+x` pour un script. |
| droits-fichiers | `sh script.sh` marche sans `x` ; `./script.sh` exige `x`. |
| droits-repertoires | `r` lister, `x` traverser, `w` créer et supprimer ; supprimer exige `w` et `x` sur le répertoire. |
| droits-repertoires | `--x` : `cat test/toto` marche, `ls test` non ; `-wx` : on crée et supprime, on ne liste pas. |
| masque-creation | Droits = 777 (666 pour un fichier) moins le masque ; `umask 077` → 600 / 700 ; remettre `umask 0022`. |
| redirections-tubes | `> f` écrase, `>> f` ajoute, `2> f` erreurs, `> a 2> b` sépare les deux flux. |
| redirections-tubes | `ls dir \| wc -l` compte ; `find dir -type l \| wc -l` compte les liens ; `wc -w * \| sort -n` trie. |
| executables-path | `./prog` seulement depuis son dossier ; sinon l'ajouter au PATH : `export PATH=$PATH:$PWD`. |
| executables-path | Shebang `#!/usr/bin/env python3` : `env` retrouve `python3` dans le PATH. |

**Piège central** : on supprime un fichier avec le `w` du **répertoire**, pas celui du fichier.
