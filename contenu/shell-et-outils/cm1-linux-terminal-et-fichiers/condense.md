# CM1 — Linux, terminal et fichiers, en bref

**Méthode** : le shell affiche un prompt, lit une commande, l'exécute, affiche le résultat, recommence ; tout le reste (fichiers, variables, archives) se pilote avec des commandes et des options.

| Notion | À retenir |
|---|---|
| terminal-shell-prompt | Le terminal lance `bash` ; prompt `user@hote:repertoire$`, le `$` veut dire « prêt ». |
| terminal-shell-prompt | Boucle : prompt, saisie, analyse, exécution, affichage, retour à l'étape 1. |
| terminal-shell-prompt | `tab` complète, `↑` rappelle, `Ctrl+R` cherche, `Ctrl+C` interrompt, `Ctrl+D` quitte, `Ctrl+S` / `Ctrl+Q` gèle / dégèle l'affichage. |
| arborescence-chemins | Racine `/`, séparateur `/` ; `.` = courant, `..` = parent, `~` = home, `$HOME` = home. |
| arborescence-chemins | Absolu = depuis `/` ; relatif = depuis le répertoire courant ; `pwd` l'affiche. |
| arborescence-chemins | `cd` change de répertoire, `cd` seul retourne au home. |
| fichier-inode | Fichier = i-node (métadonnées) + contenu (octets). |
| fichier-inode | Répertoire = table de liens (i-numéro, nom) ; seul le système y écrit. |
| fichier-inode | Linux distingue la casse ; un nom qui commence par `.` est caché (`ls -a`). |
| fichier-inode | Un `ls -l` donne type, 9 droits, liens, propriétaire, groupe, taille, date, nom. |
| commande-options | Forme : `commande [options] [arguments]` ; `-x` une lettre, `--mot` un mot. |
| commande-options | `man commande` donne l'aide ; options fréquentes `-i`, `-f`, `-h`, `-v`. |
| commande-options | `mkdir -p a/b/c`, `cp -r`, `rm -r`, `ls -lh`, `tree -L 2`. |
| variables-environnement | `nom=valeur` sans espaces ; `$nom` ou `${nom}` ; `unset` annule. |
| variables-environnement | Locale = shell courant seulement ; `export` la rend visible des sous-shells. |
| variables-environnement | `PATH` = répertoires où le shell cherche les commandes, séparés par `:`. |
| variables-environnement | `.bashrc` est lu à chaque terminal ; le modifier puis `source ~/.bashrc`. `EDITOR` choisit l'éditeur par défaut. |
| variables-environnement | `eval echo $B` relit le contenu de `B` comme une commande. |
| variables-environnement | Alias : `alias ll='ls -l'` ; permanent seulement s'il est dans `.bashrc`. |
| archivage-compression | `gzip`/`gunzip` (`.gz`), `bzip2` (`.bz2`), `zip`/`unzip`, `tar` (`.tar`). |
| archivage-compression | `tar cvf` crée, `xvf` extrait, `tvf` liste ; `z` gzip, `j` bzip2, `k` n'écrase pas. |
| archivage-compression | Extraction : écrase par défaut ; `file` donne le vrai type de l'archive. |

**Commandes à ne pas confondre** : `ls` lit un répertoire, `cat` lit un fichier, `find` cherche par critère, `file` identifie le type.
