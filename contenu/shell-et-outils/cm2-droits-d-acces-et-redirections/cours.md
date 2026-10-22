# CM 2 — Droits d'accès et redirections

> **Info :** Sources : CM2 « Shell et outils » (chapitres 1 et 2), TP3 (permissions, masque, redirections, `PATH`).

## À savoir faire
- Lire les droits d'un fichier dans un `ls -l` et savoir à qui ils s'appliquent.
- Modifier des droits avec `chmod`, en symbolique (`u+x`) et en octal (`754`).
- Expliquer les droits spéciaux set-uid, set-gid et sticky.
- Calculer les droits par défaut avec `umask`.
- Rediriger les sorties standard et d'erreur, et l'entrée standard.
- Enchaîner des filtres avec un tube (`|`).

## L'essentiel

### 1. Trois catégories d'utilisateurs
Un fichier a un **propriétaire** et un **groupe propriétaire** (qui peut différer du groupe du propriétaire). Les droits `rwx` sont donnés trois fois :

1. pour l'**utilisateur** propriétaire (`u`) ;
2. pour les membres du **groupe** propriétaire (`g`) ;
3. pour les **autres** (`o`).

Chaque utilisateur a un numéro **UID**, chaque groupe un **GID** ; ces informations sont dans `/etc/passwd`.

```text
-rwxr--r--  1 jml ens 1614 Oct 23 15:06 index.html
drwxr-xr-x  3 jml ens  512 Oct 11 15:55 licpro/
```
On lit : type (`-` ou `d`), les 9 droits (propriétaire, groupe, autres), le nombre de liens, le propriétaire, le groupe, la taille, la date, le nom. `stat` ajoute les dates d'accès et de changement.

### 2. Les droits ne veulent pas dire la même chose
| Droit | Sur un fichier | Sur un répertoire |
|---|---|---|
| `r` | lire le contenu | lister le contenu (`ls`) |
| `w` | modifier le contenu | créer et supprimer des fichiers (même sans droit sur ces fichiers) |
| `x` | exécuter | traverser le répertoire, accéder à son contenu |

Conséquences utiles (TP3) : un répertoire en `--x` ne se liste pas (`ls` échoue) mais un fichier connu peut encore être lu (`cat test/toto`) ; en `-wx`, on peut créer un fichier mais pas lister ; pour supprimer un fichier il faut le droit `w` sur **le répertoire**, pas sur le fichier.

### 3. chmod : format symbolique
Trois informations : **qui** (`u`, `g`, `o`, `a` pour tous), **quelle action** (`+` ajouter, `-` enlever, `=` initialiser), **quel accès** (`r`, `w`, `x`).

```bash
chmod go-w fichA     # enlève l'écriture au groupe et aux autres
chmod u+x fichA      # ajoute l'exécution au propriétaire
chmod ug+rw fichA    # ajoute lecture et écriture au propriétaire et au groupe
chmod ug=rw fichA    # fixe exactement rw-rw----
chmod a+r fichA      # lecture pour tout le monde
```

### 4. chmod : mode octal
`rwx` se code sur 3 bits, donc un chiffre de 0 à 7 par catégorie.

| Symbolique | Binaire | Octal |
|---|---|---|
| `---` | 000 | 0 |
| `--x` | 001 | 1 |
| `-w-` | 010 | 2 |
| `-wx` | 011 | 3 |
| `r--` | 100 | 4 |
| `r-x` | 101 | 5 |
| `rw-` | 110 | 6 |
| `rwx` | 111 | 7 |

On donne trois chiffres : propriétaire, groupe, autres. `775` = `rwxrwxr-x`, `640` = `rw-r-----`, `760` = `rwxrw----`, `600` = `rw-------`.

```bash
chmod 750 fichier    # rwxr-x--- : propriétaire tout, groupe lecture+traverse, rien pour les autres
```

### 5. Droits particuliers
Les droits sont stockés sur 12 bits : 9 pour `rwx`, 3 pour les droits spéciaux.

- **set-uid** : un binaire exécutable s'exécute avec les droits de son **propriétaire**. Le `x` du propriétaire devient `s`. C'est ce qui permet à tout utilisateur de changer son mot de passe via `/usr/bin/passwd` (`-rwsr-xr-x root root`).
- **set-gid** : même principe, mais avec le **groupe** du fichier.
- **sticky bit** : dans un répertoire ouvert en écriture à tous (comme `/tmp`), seul le propriétaire d'un fichier peut le supprimer. Le `x` des autres devient `t` (`drwxrwxrwt`).

### 6. Changer de groupe ou de propriétaire
```bash
chgrp doct f1        # change le groupe propriétaire
chown herve f1       # change le propriétaire (root, ou cas particulier)
chown -R jml projet  # récursivement
```
Un utilisateur ne peut pas donner un fichier à quelqu'un d'autre : `chown` sur un fichier d'un autre propriétaire répond `Not owner`.

### 7. Le masque de création (umask)
À la création, les droits par défaut sont `777` moins le **masque** :

```text
Droits complets : rwx rwx rwx  (777)
Masque          : --- -w- rwx  (027)
Droits accordés : rwx r-x ---  (750)
```
- `umask` affiche le masque courant, `umask 022` le modifie.
- Le droit `x` n'est **jamais** attribué par défaut à un fichier ordinaire : avec `umask 022`, un fichier naît en `644` et un répertoire en `755`.
- Masque `077` : fichiers `600` et répertoires `700`. Masque `002` : fichiers `664`, répertoires `775`.
- Valeur usuelle : `umask 0022`.

```pas-a-pas
{
  "titre": "umask 027 : les droits d'un fichier et d'un répertoire créés",
  "code": [
    "umask 027",
    "mkdir rep",
    "touch fich"
  ],
  "etapes": [
    {"ligne":0,"vars":{"masque":"027"},"note":"Le masque 027 se lit « --- -w- rwx » : ce sont les droits à retirer (rien au propriétaire, w au groupe, tout aux autres).","schema":{"type":"tableau","cases":["-","-","-","-","w","-","r","w","x"],"marques":{"propriétaire":0,"groupe":3,"autres":6},"surligne":[4,6,7,8]}},
    {"ligne":1,"vars":{"droits de rep":"750"},"note":"Un répertoire part de 777 (rwx rwx rwx) : on retire le masque, il reste rwxr-x---.","schema":{"type":"tableau","cases":["r","w","x","r","-","x","-","-","-"],"marques":{"propriétaire":0,"groupe":3,"autres":6},"fixes":[0,1,2,3,5]}},
    {"ligne":2,"vars":{"droits de fich":"640"},"note":"Un fichier part de 666 : le x n'est jamais donné par défaut. On retire le masque, il reste rw-r-----.","schema":{"type":"tableau","cases":["r","w","-","r","-","-","-","-","-"],"marques":{"propriétaire":0,"groupe":3,"autres":6},"fixes":[0,1,3]}}
  ]
}
```

### 8. Descripteurs et redirections
Tout processus lit et écrit via des **descripteurs de fichiers** numérotés :

| Descripteur | Nom | Par défaut |
|---|---|---|
| 0 | entrée standard (stdin) | clavier |
| 1 | sortie standard (stdout) | écran |
| 2 | sortie d'erreur (stderr) | écran |

La commande ne connaît pas la destination : c'est le shell qui met les redirections en place **avant** de lancer la commande.

```bash
ls -l > liste          # stdout dans liste (créé ou écrasé ; ls > liste = ls 1> liste)
ls -l >> liste         # stdout ajouté à la fin de liste
rm -v liste truc 2> erreurs   # stderr dans erreurs (pas d'espace entre 2 et >)
rm -i fichier* < confirm      # stdin lu dans le fichier confirm
rm -v liste truc > sorties 2>&1   # stdout et stderr dans le même fichier
(commande1 ; commande2) > fichier # rediriger plusieurs commandes
commande > sortie < entree 2> erreur
commande 2> /dev/null         # jeter les erreurs
```

```pas-a-pas
{
  "titre": "Redirection : ls -l > liste 2>&1",
  "code": [
    "ls -l > liste 2>&1"
  ],
  "etapes": [
    {
      "ligne": 0,
      "note": "Avant l'exécution, les trois descripteurs du processus pointent vers le terminal : clavier pour l'entrée, écran pour les deux sorties.",
      "vars": { "commande": "ls -l" },
      "schema": {
        "type": "tableau",
        "cases": ["tty", "tty", "tty"],
        "marques": { "stdin": 0, "stdout": 1, "stderr": 2 }
      }
    },
    {
      "ligne": 0,
      "note": "Le shell ouvre (ou crée) le fichier liste et branche le descripteur 1 dessus : la sortie standard n'ira plus à l'écran.",
      "vars": { "fichier": "liste" },
      "schema": {
        "type": "tableau",
        "cases": ["tty", "liste", "tty"],
        "marques": { "stdin": 0, "stdout": 1, "stderr": 2 },
        "surligne": [1]
      }
    },
    {
      "ligne": 0,
      "note": "2>&1 duplique le descripteur 1 sur le descripteur 2 : les erreurs vont dans le même fichier que la sortie standard.",
      "vars": { "erreurs": "liste" },
      "schema": {
        "type": "tableau",
        "cases": ["tty", "liste", "liste"],
        "marques": { "stdin": 0, "stdout": 1, "stderr": 2 },
        "surligne": [1, 2]
      }
    },
    {
      "ligne": 0,
      "note": "Le shell lance alors ls -l, qui écrit normalement : tout arrive dans liste, rien ne s'affiche à l'écran.",
      "vars": { "affichage": "aucun" },
      "schema": {
        "type": "tableau",
        "cases": ["tty", "liste", "liste"],
        "marques": { "stdin": 0, "stdout": 1, "stderr": 2 },
        "fixes": [1, 2]
      }
    }
  ]
}
```

### 9. Tubes et filtres
Un **tube** branche la sortie standard d'un processus sur l'entrée standard d'un autre, sans fichier intermédiaire :

```bash
ls | wc -w              # nombre de mots de la sortie de ls
ls | grep redir | wc -l # on peut enchaîner plus de deux tubes
```
Le système synchronise les deux processus : le lecteur est bloqué si le tube est vide (et qu'un écrivain existe encore), l'écrivain est bloqué si le tube est plein.

```pas-a-pas
{
  "titre": "ls | wc -w : un tube entre deux processus",
  "code": [
    "ls | wc -w"
  ],
  "etapes": [
    {"ligne":0,"note":"Le shell crée un tube et lance les deux processus en même temps. ls n'écrit que dans le tube, wc ne lit que dans le tube.","schema":{"type":"tube","gauche":{"nom":"ls","lecture":"ferme","ecriture":"ouvert"},"droite":{"nom":"wc -w","lecture":"ouvert","ecriture":"ferme"},"tampon":""}},
    {"ligne":0,"note":"ls écrit la liste de ses noms sur sa sortie standard, sans savoir que c'est un tube. Si le tube est plein, ls est bloqué.","schema":{"type":"tube","gauche":{"nom":"ls","lecture":"ferme","ecriture":"ouvert"},"droite":{"nom":"wc -w","lecture":"ouvert","ecriture":"ferme"},"tampon":"f1 f2 f3 f4"}},
    {"ligne":0,"vars":{"wc -w affiche":4},"note":"wc lit son entrée standard au fur et à mesure et compte les mots. Si le tube est vide mais que ls n'a pas fini, wc attend.","schema":{"type":"tube","gauche":{"nom":"ls","lecture":"ferme","ecriture":"ferme"},"droite":{"nom":"wc -w","lecture":"ouvert","ecriture":"ferme"},"tampon":""}}
  ]
}
```

Une commande qui lit sur son entrée standard et écrit sur sa sortie standard est un **filtre** (`cat`, `wc`, `grep`). `ls` n'est pas un filtre : il lit un répertoire, pas son entrée.

## Pièges fréquents
- Croire que `r` sur un répertoire suffit pour lire un fichier : il faut aussi `x` pour le traverser.
- Vouloir supprimer un fichier en changeant ses droits : c'est le droit `w` du **répertoire** qui compte.
- Écrire `chmod 777` « pour que ça marche » : on ouvre tout à tout le monde.
- Confondre `chmod` et `umask` : `chmod` modifie un fichier existant, `umask` fixe les droits des futurs fichiers.
- Oublier que `x` n'est jamais donné par défaut à un fichier : un script créé n'est pas exécutable, il faut `chmod u+x`.
- Mettre un espace dans `2> erreurs` : `cmd 2 > erreurs` passe `2` comme **argument** de la commande (`ls: cannot access '2'`), envoie la sortie standard dans `erreurs`, et les messages d'erreur restent à l'écran.
- Rediriger deux fois un même descripteur (`cmd > f1 > f2`) : un processus n'a qu'une sortie, seule la dernière compte.
- `>` écrase le fichier ; `>>` ajoute. Une erreur classique efface un fichier qu'on voulait compléter.
- Écrire `cmd 2>&1 > fichier` au lieu de `cmd > fichier 2>&1` : l'ordre des redirections change le résultat.
- Faire `cat` de la sortie d'une commande : inutile dans `cat fichier | grep motif`, `grep motif fichier` suffit.

## Questions de vérification
1. À quoi correspondent les neuf caractères qui suivent le type dans un `ls -l` ?
2. Que signifient `r`, `w` et `x` sur un répertoire ?
3. Traduire `chmod ug=rw,o=r` en octal.
4. Quel est le rôle du sticky bit et comment le repère-t-on dans `ls -l` ?
5. Avec un masque `027`, quels droits reçoivent un répertoire et un fichier créés ?
6. Que fait exactement `ls -l > liste 2>&1` ?
7. Pourquoi `cat fichier | grep motif` peut-il s'écrire plus simplement ?
