# CM2 — Droits d'accès et redirections, en bref

**Méthode** : trois catégories (propriétaire, groupe, autres), trois droits (r, w, x) → 9 bits, plus 3 bits spéciaux ; les flux d'un processus passent par trois descripteurs (0, 1, 2) que le shell redirige.

| Notion | À retenir |
|---|---|
| droits-rwx | u = propriétaire, g = groupe, o = autres ; UID et GID dans /etc/passwd. |
| droits-rwx | Fichier : r lire, w modifier, x exécuter. Répertoire : r lister, w créer/supprimer, x traverser. |
| droits-rwx | Pour supprimer un fichier, il faut le droit w sur le répertoire qui le contient. |
| droits-rwx | `ls -l` : type, 9 droits, liens, propriétaire, groupe, taille, date, nom. |
| chmod | Symbolique : qui (u g o a), action (+ - =), accès (r w x) ; ex. `chmod ug=rw`. |
| chmod | Octal : r=4, w=2, x=1, additionnés par catégorie ; ex. `750` = rwxr-x---. |
| chmod | `chmod u+x script.sh` rend un script exécutable ; `chgrp` et `chown` changent groupe et propriétaire. |
| droits-particuliers | set-uid : s à la place du x du propriétaire, exécution avec les droits du propriétaire. |
| droits-particuliers | set-gid : même principe avec le groupe du fichier. |
| droits-particuliers | sticky bit : t à la place du x des autres ; seul le propriétaire supprime son fichier (ex. /tmp). |
| umask | Droits accordés = 777 – masque ; `umask` affiche, `umask 022` modifie. |
| umask | x n'est jamais donné par défaut à un fichier : masque 022 → fichier 644, répertoire 755. |
| umask | Masque 077 → fichiers 600, répertoires 700 ; valeur usuelle `umask 0022`. |
| redirections | Descripteurs : 0 entrée, 1 sortie standard, 2 sortie d'erreur. |
| redirections | `>` écrase, `>>` ajoute, `2>` erreurs, `<` entrée, `2>&1` réunit les deux sorties. |
| redirections | `/dev/null` jette les messages ; l'ordre `> fichier 2>&1` compte. |
| tubes-filtres | `cmd1 \| cmd2` : sortie de cmd1 sur l'entrée de cmd2, sans fichier intermédiaire. |
| tubes-filtres | Un filtre lit son entrée standard et écrit sa sortie standard (cat, wc, grep) ; ls n'en est pas un. |

**Piège central** : les droits d'un répertoire (traverser, lister, créer/supprimer) ne sont pas ceux du fichier qu'il contient.
