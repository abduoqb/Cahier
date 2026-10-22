# CM 1 — Linux, terminal et fichiers

> **Info :** Sources : CM1 « Shell et outils » (chapitres 1 à 4), TP1 (premières commandes, fichiers et répertoires), TP2 (archives, `find`) et le fichier `.bashrc` d'exemple.

## À savoir faire
- Ouvrir un terminal, lire le prompt et dire dans quel répertoire on se trouve.
- Se déplacer avec `cd` et distinguer chemin absolu, chemin relatif, `~`, `.` et `..`.
- Lister, créer, copier, déplacer et supprimer fichiers et répertoires (`ls`, `touch`, `cp`, `mv`, `rm`, `mkdir`).
- Lire un `ls -l` : type, droits, liens, propriétaire, groupe, taille, date, nom.
- Composer une commande `commande [options] [arguments]` et trouver l'aide avec `man`.
- Configurer son environnement : variables, `export`, `PATH`, `.bashrc`, alias.
- Créer et extraire une archive (`zip`, `tar`, `gzip`).

## L'essentiel

### 1. Vocabulaire de départ
- Un ordinateur ne fait que des tâches élémentaires, très vite ; le système d'exploitation fournit les outils de base (fichiers, processus, entrées/sorties).
- **Source** : fichier contenant les instructions. **Exécutable** : programme que le système peut lancer.
- **Shell** : le langage des instructions comprises par le système. **Terminal** : le programme qui lit les commandes au clavier et écrit le résultat à l'écran.
- **Processus** : tâche élémentaire exécutée par le système.
- **Entrée standard** (clavier par défaut), **sortie standard** (écran), **sortie d'erreur** (écran aussi par défaut). Chaque programme lit et écrit dans ces « fichiers ».
- Tout est codé en **bits**, groupés en **octets** (8 bits, 256 valeurs). L'**ASCII** code les caractères ; l'**unicode** lève les limites locales.

### 2. La boucle du shell
Quand un terminal est ouvert, `bash` répète toujours les mêmes étapes :

1. afficher l'invite de commande (**prompt**) ;
2. donner la main au clavier jusqu'à la touche Entrée ;
3. analyser le texte et le transformer en commande ;
4. demander l'exécution au système ;
5. afficher le résultat ;
6. revenir à l'étape 1.

Le prompt a la forme `utilisateur@hote:repertoire$`. Le `$` signifie « le shell est prêt ». Par exemple `lecarpentier@N302L-S16P02:~/Postman$`.

`bash` exécute des programmes trouvés dans les répertoires du `PATH`, mais aussi ses propres commandes, dites **builtin** : `cd`, `alias`, gestion des variables, historique.

| Touche | Effet |
|---|---|
| `tab` | complète la commande ou le nom de fichier (deux appuis : liste les solutions) |
| `↑` `↓` | commande précédente / suivante |
| `Ctrl+R` | recherche dans l'historique |
| `Ctrl+A` / `Ctrl+E` | curseur en début / en fin de ligne |
| `Ctrl+C` | interrompt la commande en cours |
| `Ctrl+D` | termine le shell (équivaut à `exit`) |
| `Ctrl+L` | efface le terminal |
| `Ctrl+Z` | stoppe la commande ; `bg` la relance en arrière-plan, `fg` au premier plan |

`!!` rappelle la dernière commande, `!c` la dernière commande commençant par `c`, `history` liste les dernières commandes (taille réglée par `HISTSIZE` et `HISTFILESIZE`).

Autres détails du cours : `Ctrl+S` gèle l'affichage et `Ctrl+Q` le dégèle (utile quand un terminal semble bloqué) ; `Ctrl+Alt+F1` à `F6` ouvrent six consoles texte et `Ctrl+Alt+F7` revient au terminal graphique ; sélectionner un texte à la souris le copie, et le bouton du milieu le colle.

### 3. Fichiers, répertoires et i-node
- Un fichier a deux parties : son **i-node** (métadonnées : dates, taille, propriétaire, droits…) et son **contenu** (suite d'octets).
- Un **répertoire** est un fichier particulier : une table de liens `(i-numéro, nom)`. Seul le système peut y écrire.
- Linux **distingue majuscules et minuscules** : `toto` et `Toto` sont deux noms différents.
- Un nom commençant par un point `.` est **caché** : il n'apparaît pas par défaut (`ls -a` pour les voir). Ces fichiers stockent la configuration (`.mozilla`, `.bashrc`).
- La **racine** est `/` et le séparateur de chemin est `/`. (Sous Windows : racine `C:\`, séparateur `\`.)

### 4. Chemins absolus et relatifs
| Écriture | Sens |
|---|---|
| `/home/jml/projet` | chemin **absolu** : on part de la racine |
| `projet/fich` ou `./projet/fich` | chemin **relatif** : on part du répertoire courant |
| `.` | le répertoire courant |
| `..` | le répertoire parent (`cd ..` remonte d'un niveau) |
| `~` | la racine du répertoire personnel (`/home/jml`), donc `~/projet` |
| `cd` sans argument | retourne dans le home |

`pwd` affiche le chemin du répertoire courant, `cd` le change. Le home est aussi dans la variable `$HOME`.

### 5. Composer une commande
Syntaxe générale : `commande [option...] [argument...]`, par exemple `wc -l /etc/fstab`.

- Un **argument** dit sur quoi travailler ; une **option** (ou paramètre) change la façon de travailler.
- Une option d'une lettre est précédée d'un tiret (`-R`), une option en mot de deux tirets (`--set=...`).
- Options courantes : `-i` (interactif, demande confirmation), `-f` / `--force`, `-h` / `--help`, `-v` / `--verbose`.
- Exemple du cours avec `date` : sans rien, la date au format français ; avec l'option `-R`, au format standard Linux ; avec un argument (`date --set='...'`), elle fixe la date du système. L'option change la façon de travailler, l'argument dit sur quoi.
- `man commande` affiche le manuel. Les caractères spéciaux (`*`, `$`, `|`, espace) ont un sens pour le shell : on les échappe avec `\`.

### 6. Les commandes de tous les jours
| Commande | Rôle |
|---|---|
| `pwd` | afficher le répertoire courant |
| `ls`, `ls -l`, `ls -a`, `ls -lh` | lister ; format long ; fichiers cachés ; tailles lisibles (140K) |
| `tree -L 2` | arborescence, profondeur limitée à 2 niveaux |
| `cd chemin` | changer de répertoire |
| `mkdir`, `mkdir -p a/b/c` | créer un répertoire, ou toute une arborescence |
| `touch f` | créer un fichier vide (ou mettre à jour sa date) |
| `cat f`, `cat > f` | afficher ; écrire dans `f` (terminer par `Ctrl+D`) |
| `cp f1 f2`, `cp -r d1 d2` | copier un fichier, copier un répertoire récursivement |
| `mv a b` | déplacer ou renommer |
| `rm`, `rm -r`, `rm -f`, `rm -i` | supprimer un fichier ; un répertoire et son contenu ; sans jamais demander ; en confirmant chaque suppression |
| `find . -name "*.py"` | chercher par nom ; `-iname` ignore la casse ; `-type f` / `-type d` |
| `file f` | dire le type réel d'un fichier (indépendamment de l'extension) |

Dans un `ls -l`, on lit dans l'ordre : le **type** (`-` fichier, `d` répertoire, `l` lien), les **9 droits**, le **nombre de liens**, le **propriétaire**, le **groupe**, la **taille en octets**, la **date de modification**, le **nom**. `stat` donne en plus les dates d'accès et de changement.

### 7. Variables et environnement
```bash
systeme=linux          # affectation : PAS d'espace autour du =
echo $systeme          # ou ${systeme}
unset systeme          # annule la variable
set                    # liste les variables du shell courant
export EDITOR=emacs    # rend la variable visible des sous-shells
env                    # liste les variables d'environnement
```

La commande `eval` évalue un texte comme une commande, ce qui permet de lire le contenu d'une variable qui contient elle-même un nom de variable :
```bash
A=toto; B='$A'
echo $B          # $A    : B contient le texte « $A »
eval echo $B     # toto  : eval relit ce texte et l'exécute
```
Une variable créée dans le terminal est **locale** : un sous-shell ne la connaît pas. `export` en fait une **variable d'environnement**, connue du terminal et de ses sous-shells. Par convention leurs noms sont en majuscules.

```pas-a-pas
{
  "titre": "Variable locale ou variable d'environnement",
  "code": [
    "A=toto",
    "bash -c 'echo \"[$A]\"'",
    "export A",
    "bash -c 'echo \"[$A]\"'"
  ],
  "etapes": [
    {"ligne":0,"vars":{"A dans le shell":"toto","A dans un sous-shell":"(inconnue)"},"note":"A est créée dans le shell courant : elle est locale."},
    {"ligne":1,"vars":{"affichage":"[]"},"note":"bash -c lance un sous-shell, qui ne connaît pas A : il affiche des crochets vides."},
    {"ligne":2,"vars":{"A dans un sous-shell":"toto (hérité)"},"note":"export transforme A en variable d'environnement : les sous-shells en héritent."},
    {"ligne":3,"vars":{"affichage":"[toto]"},"note":"Cette fois le sous-shell connaît A."}
  ]
}
```

| Variable | Contenu |
|---|---|
| `USER` | identifiant de l'utilisateur |
| `HOME` | chemin du home |
| `PATH` | répertoires où le shell cherche les commandes |
| `PWD` / `OLDPWD` | répertoire courant / précédent |
| `HOSTNAME` | nom de la machine |
| `LANG` | langue et encodage |
| `EDITOR` | éditeur par défaut |
| `UID`, `SHELL`, `PS1` | id système, chemin du shell, format du prompt |

`PATH` est une liste de répertoires séparés par `:`. Le shell y cherche la commande tapée. Avec `export PATH=''`, plus aucune commande n'est trouvée : `/bin/ls` fonctionne encore, `ls` non. On ajoute un répertoire avec `export PATH=$PATH:/chemin/du/dossier`.

```pas-a-pas
{
  "titre": "Le shell cherche une commande dans le PATH",
  "code": [
    "sauve=$PATH",
    "export PATH=''",
    "/bin/ls",
    "ls",
    "export PATH=$sauve",
    "ls"
  ],
  "etapes": [
    {"ligne":0,"vars":{"PATH":"/usr/local/bin:/usr/bin:/bin","sauve":"/usr/local/bin:/usr/bin:/bin"},"note":"On garde une copie du PATH : sans elle, on ne pourrait pas le remettre."},
    {"ligne":1,"vars":{"PATH":"(vide)"},"note":"Le PATH est maintenant vide : le shell ne sait plus où chercher les commandes."},
    {"ligne":2,"vars":{"résultat":"la liste des fichiers"},"note":"Avec un chemin complet, le shell lance directement /bin/ls : il n'a pas besoin du PATH. Ça marche."},
    {"ligne":3,"vars":{"résultat":"ls : command not found"},"note":"Avec le nom seul, bash cherche ls dans chaque répertoire du PATH. La liste est vide : commande introuvable."},
    {"ligne":4,"vars":{"PATH":"/usr/local/bin:/usr/bin:/bin"},"note":"On remet l'ancienne valeur."},
    {"ligne":5,"vars":{"résultat":"la liste des fichiers"},"note":"bash retrouve ls dans /bin (ou /usr/bin) : à quoi sert le PATH est clair, il dit où chercher les commandes."}
  ]
}
```

### 8. Configuration : .bashrc et alias
- `~/.bashrc` est lu **à chaque lancement de terminal** : c'est là qu'on met variables, alias et réglages.
- `~/.bash_profile` n'est lu qu'au démarrage de la session (une seule fois).
- Après modification : `source ~/.bashrc` (ou `. ~/.bashrc`) pour recharger sans rouvrir de terminal.
- Un **alias** raccourcit une commande : `alias ll='ls -l'`, `alias la='ls -a'`, `alias rm='rm -i'`. Créé dans le terminal, il disparaît à la fermeture ; mis dans `.bashrc`, il est permanent.
- L'éditeur par défaut (git, `crontab`…) se choisit avec la variable `EDITOR` : `export EDITOR=nano`. Les éditeurs en console du cours sont `nano`, `jed` (celui des machines de TP), `emacs` et `vim` : il faut en tester plusieurs, en choisir un et connaître ses raccourcis (enregistrer, quitter).

Extrait commenté d'un `.bashrc` typique (celui d'Ubuntu, complété d'un alias et de `EDITOR`) :
```bash
case $- in *i*) ;; *) return;; esac   # shell non interactif : on ne fait rien
HISTCONTROL=ignoreboth                # pas de doublons ni de lignes commençant par un espace
shopt -s histappend                   # ajouter à l'historique au lieu de l'écraser
HISTSIZE=1000                         # lignes gardées en mémoire
HISTFILESIZE=2000                     # lignes gardées dans ~/.bash_history
PS1='\u@\h:\w\$ '                     # prompt : utilisateur@hôte:répertoire$
alias ll='ls -alF'                    # raccourcis de commandes
alias grep='grep --color=auto'
export EDITOR=nano                    # éditeur par défaut
```

### 9. Archives et compression
| Outil | Usage |
|---|---|
| `zip` / `unzip` | archives `.zip` (venues de Windows) |
| `unrar` | archives `.rar` |
| `gzip f` / `gunzip f.gz` | compresse / décompresse un fichier (ajoute ou retire `.gz`) |
| `bzip2` / `bunzip2` | idem avec l'extension `.bz2` |
| `tar` | archive (Tape ARchive) de plusieurs fichiers dans un `.tar` |

Options `tar` : `c` crée, `x` extrait, `t` liste sans extraire, `v` détaille, `f` donne le nom de l'archive (toujours avec `v` et `f`), `z` compresse avec gzip (`.tar.gz` ou `.tgz`), `j` avec bzip2, `k` n'écrase pas les fichiers existants.

```bash
tar cvf fichiers_tex.tar *.tex        # créer
tar tvf fichiers_tex.tar tp*          # lister ceux qui commencent par tp
tar xvf fichiers_tex.tar tp*          # extraire ceux qui commencent par tp
tar zcvf cours.tar.gz *               # créer une archive compressée
```
Par défaut l'extraction **écrase** les fichiers de même nom déjà présents.

## Pièges fréquents
- Écrire `var = valeur` : il faut `var=valeur`, sans espace.
- Croire qu'une variable locale passe au sous-shell : il faut `export`.
- Oublier `-a` et ne pas voir les fichiers cachés ; oublier `-h` pour des tailles lisibles.
- Confondre `ls` (qui lit un répertoire) et `cat` (qui lit un fichier) ; `cat repertoire` échoue.
- `rm` ne demande normalement rien (sauf si l'alias `rm='rm -i'` est actif, ce qui est fréquent sur les machines de TP : alors `-f` supprime sans confirmer). Il n'y a pas de corbeille : la suppression est définitive.
- `cd ..` remonte d'un niveau ; `cd ../..` de deux.
- Croire que le prompt affiche le chemin complet : il n'affiche souvent que le répertoire courant.
- Extraire un `.tar` ou un `.zip` sans vérifier le type avec `file` : l'extension peut mentir.
- `tar xvf` écrase les fichiers existants sans prévenir (option `k`).

## Questions de vérification
1. Quelles sont les six étapes de la boucle d'un interpréteur de commandes ?
2. Par rapport à `/home/jml`, comment écrire le fichier `fich` du répertoire `projet` en absolu, en relatif et avec `~` ?
3. Que contient l'i-node d'un fichier ? Et le contenu d'un répertoire ?
4. Quelle est la différence entre une variable locale et une variable d'environnement ?
5. Où est défini l'alias `ll='ls -l'` pour qu'il survive à la fermeture du terminal ?
6. Quelle commande crée `systeme.zip` à partir du répertoire `systeme` ?
