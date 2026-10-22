# CM 4 — Scripts bash

> **Info :** Sources : CM5 « Hello World, variables, tests, structures de contrôle, arguments » et TP6 (scripts de création de fichiers, rangement).

## À savoir faire
- Écrire un script shell exécutable et savoir pourquoi `#!/bin/bash` est en première ligne.
- Affecter et lire des variables, faire du calcul avec `$(( ))` ou `(( ))`.
- Tester des entiers, des chaînes et des fichiers avec `test`, `[ ]`, `(( ))` et les doubles crochets de bash.
- Écrire un `if`, un `for`, un `while` et un `case`.
- Utiliser le globbing et les expansions d'accolades dans une boucle.
- Lire les arguments d'un script avec `$1`, `$#`, `$@` et `shift`.

## L'essentiel

### 1. À quoi sert un script shell
`bash` est un langage complet : variables, tests, boucles, fonctions. On s'en sert pour **automatiser des tâches** (manipuler des fichiers, lancer des programmes, enrober un outil), pas pour faire du calcul intensif.

On préfère le shell à Python ou PHP parce qu'il est présent sur presque toutes les machines Unix/Linux, et parce qu'il est très efficace pour lancer des processus.

### 2. Hello World
Un script shell a quatre caractéristiques :

1. c'est un **fichier exécutable** ;
2. sa première ligne est `#!/bin/bash` (ou `#!/bin/sh` pour le shell standard) : c'est le **shebang**, il indique le langage ;
3. son extension est `.sh` en général (ce n'est pas obligatoire) ;
4. toute ligne commençant par `#` est un **commentaire** (sauf le shebang).

```bash
#!/bin/bash
echo "Hello World !"
```
```text
jml@odie:~/exemples$ sh hello.sh
Hello World !
```
`sh hello.sh` demande explicitement à `sh` d'exécuter le fichier, même sans droit d'exécution. Pour lancer `./hello.sh` directement, le fichier doit être exécutable (`chmod u+x hello.sh`).

`echo` écrit sur la sortie standard ; on peut la rediriger dans un fichier (`>`, `>>`). Les variables d'environnement sont accessibles directement : `$$` (numéro du processus), `$PPID` (son parent), `$HOSTNAME`, `$USER`, `$UID`, `$HOME`, `$PATH`, `$PWD`.

### 3. Variables et calculs
```bash
chaine="ceci est une chaîne"
longue="et une autre"
echo $chaine                      # lecture avec $
nvlChaine="$chaine $longue"       # concaténation
chaine=$longue                    # affectation

i=5
i=$i + 4          # FAUX : le shell tente d'exécuter la commande « + »
i=`expr $i + 4`   # ancienne syntaxe (backquotes)
i=$(expr $i + 4)  # mieux
let "i=$i+4"      # avec let
(( i = i + 4 ))   # avec la commande composée (( ))
i=$(( i + 4 ))    # ou en affectation arithmétique
```
- **Pas d'espace autour du `=`** dans une affectation.
- `$(commande)` récupère ce que la commande a affiché sur sa sortie standard. Ce n'est **pas** son code de sortie.
- `(( ... ))` évalue une expression arithmétique ; on peut aussi y initialiser plusieurs variables : `((x=2, y=3, a=x+y))`.
- `basename chemin` extrait le nom d'un fichier de son chemin ; `basename nom .ext` enlève le suffixe.

```bash
for fichier in $(ls /usr/include/*.h); do
    echo $(basename $fichier .h)
done
```

### 4. Tests
`test` compare des nombres, des chaînes, ou teste des fichiers. `[ ... ]` est une autre écriture de `test`.

| Test | Sens |
|---|---|
| `test $a -eq $b` | entiers égaux (`-ne`, `-lt`, `-le`, `-gt`, `-ge`) |
| `test -z $ch` / `test -n $ch` | chaîne vide / non vide |
| `test $ch1 = $ch2` | chaînes égales (`!=` pour différentes) |
| `test -e $f` | le fichier existe |
| `test -x $f` | le fichier est exécutable |
| `test -d $f` | c'est un répertoire |
| `test -w $f` | on peut y écrire |

Attention : `test` est une **commande**. Son résultat se lit dans `$?` : **0 = succès (test vrai)**, 1 = échec (test faux). C'est l'inverse de l'intuition.

Bash ajoute des formes plus pratiques :
- `(( $a < $b ))` : comparaison numérique avec les symboles mathématiques ;
- une commande composée à **doubles crochets** (deux crochets ouvrants, deux fermants) : comparaison de chaînes et tests de fichiers, plus permissive que `test` car elle ne découpe pas les mots. On peut aussi rester sur `test "$chaine" = "toto"` ou `test -e "$fichier"`.

```bash
a=5; b=7
test $a -lt $b ; echo "a < b ? $?"    # 0
(( a < b ))    ; echo "a < b ? $?"    # 0
```

### 5. Structures de contrôle
```bash
# if
if [ $i -eq 5 ]; then
    echo "i vaut 5"
elif test $texte = "toto"; then
    echo "texte vaut toto"
else
    echo "Tout est faux"
fi

# for sur une liste
for chaine in toto titi tutu; do
    echo "$chaine"
done

# while
i=0
while (( i < 5 )); do
    echo "i vaut $i"
    (( i++ ))
done

# case
case $nom in
    toto) echo "c'est toto" ;;
    tata) echo "c'est tata" ;;
    *)    echo "on ne sait pas qui c'est" ;;
esac
```
Les formes composées `(( ))` et les doubles crochets s'utilisent aussi dans un `if` : `if (( i == 5 ))` ou `if test "$texte" = "toto"`.

### 6. Globbing et expansion
Le **globbing** interprète les jokers sur les noms de fichiers : `*.txt` liste tous les fichiers en `.txt`, `?` remplace un caractère.

L'**expansion d'accolades** itère sur des nombres ou des lettres :
```bash
echo {1..6}    # 1 2 3 4 5 6
echo {a-d}     # a b c d
echo {1..P}    # {1..P} : expansion non reconnue, chaîne affichée telle quelle
seq 1 6        # autre moyen de générer une séquence
```
Dans `for fichier in *.sh`, le `*` est interprété par bash : inutile d'écrire `$(ls *.sh)`. La boucle `for ((a=0; a<10; a++))` évite l'expansion.

### 7. Arguments d'un script
| Variable | Contenu |
|---|---|
| `$1`, `$2`, … | les arguments passés après la commande |
| `$0` | le nom du script lancé |
| `$#` | le nombre d'arguments |
| `$@` | la chaîne de tous les arguments |
| `$?` | le code de retour de la commande précédente |

`for chaine in $@` pose problème : les espaces à l'intérieur d'un argument sont perdus (`"bli bli"` est vu comme deux mots). La solution est `shift n`, qui décale les arguments de n (1 par défaut) : `$2` devient `$1`, et ainsi de suite jusqu'à `$1` vide.

```pas-a-pas
{
  "titre": "Parcourir les arguments avec shift",
  "code": [
    "i=0",
    "while [ -n \"$1\" ]; do",
    "    echo \"$1\";",
    "    (( i = i + 1 ))",
    "    shift",
    "done",
    "echo \"On a dépilé $i arguments\""
  ],
  "etapes": [
    {
      "ligne": 0,
      "note": "Le script est lancé avec bash script.sh tata titi \"tutu tutu\" : i compte les arguments déjà traités.",
      "vars": { "i": 0, "$#": 3, "$1": "tata", "$2": "titi", "$3": "tutu tutu" }
    },
    {
      "ligne": 1,
      "note": "Le test « $1 non vide » est vrai : il reste des arguments à traiter.",
      "vars": { "test": "vrai" }
    },
    {
      "ligne": 2,
      "note": "echo affiche le premier argument, qu'on a bien mis entre guillemets.",
      "vars": { "affichage": "tata" }
    },
    {
      "ligne": 3,
      "note": "On incrémente le compteur.",
      "vars": { "i": 1 }
    },
    {
      "ligne": 4,
      "note": "shift supprime le premier argument : titi devient $1, \"tutu tutu\" devient $2.",
      "vars": { "$#": 2, "$1": "titi", "$2": "tutu tutu", "$3": "" }
    },
    {
      "ligne": 1,
      "note": "Deuxième tour : le test est encore vrai.",
      "vars": { "test": "vrai" }
    },
    {
      "ligne": 2,
      "note": "Affichage du nouvel argument courant.",
      "vars": { "affichage": "titi" }
    },
    {
      "ligne": 3,
      "note": "Compteur incrémenté.",
      "vars": { "i": 2 }
    },
    {
      "ligne": 4,
      "note": "Nouveau shift : c'est l'argument contenant un espace qui devient $1.",
      "vars": { "$#": 1, "$1": "tutu tutu", "$2": "" }
    },
    {
      "ligne": 1,
      "note": "Troisième tour : le test est encore vrai.",
      "vars": { "test": "vrai" }
    },
    {
      "ligne": 2,
      "note": "Les guillemets conservent l'espace : tout l'argument est affiché d'un bloc.",
      "vars": { "affichage": "tutu tutu" }
    },
    {
      "ligne": 3,
      "note": "Compteur incrémenté.",
      "vars": { "i": 3 }
    },
    {
      "ligne": 4,
      "note": "Dernier shift : il n'y a plus d'argument.",
      "vars": { "$#": 0, "$1": "" }
    },
    {
      "ligne": 1,
      "note": "Le test « $1 non vide » est faux : la boucle s'arrête.",
      "vars": { "test": "faux" }
    },
    {
      "ligne": 6,
      "note": "Le script affiche le nombre d'arguments dépilés : 3, espaces compris.",
      "vars": { "affichage": "On a dépilé 3 arguments" }
    }
  ]
}
```

Application : vérifier le nombre d'arguments avant de commencer, et écrire le message d'usage sur la **sortie d'erreur**.
```bash
usage="Usage : sh 02-entrees.sh source destination"
if (( $# != 2 )); then
    echo "$usage" 1>&2
    exit 1
fi
```
`exit 1` termine le script en signalant un échec ; `1>&2` envoie le message sur la sortie d'erreur.

## Pièges fréquents
- Oublier le `#!/bin/bash` : les syntaxes bash (doubles crochets, `(( ))`) peuvent ne pas être comprises par `sh`.
- Lancer `./script.sh` sans `chmod u+x` : permission denied. `sh script.sh` fonctionne, lui.
- Écrire `i = 5` avec des espaces : le shell cherche une commande.
- Croire que `i=$i+4` fait un calcul : il faut `(( ))`, `$(( ))` ou `expr`.
- Interpréter `$?` à l'envers : 0 = succès, 1 = échec.
- Oublier `then`, `do`…`done`, `fi`, `esac` : le script ne se termine jamais ou signale une erreur de syntaxe.
- Boucler avec `for x in $@` : les arguments contenant des espaces sont découpés ; utiliser `while [ -n "$1" ]` avec `shift`.
- Oublier les guillemets autour de `"$1"` : un argument vide ou avec espace casse le test.
- Afficher le message d'usage sur la sortie standard au lieu de la sortie d'erreur (`1>&2`).
- Écrire `$(ls *.sh)` alors que le globbing suffit : `for f in *.sh`.
- Croire que `$(commande)` donne le code de retour : il donne la sortie standard ; le code est dans `$?`.

## Questions de vérification
1. Que contient la première ligne d'un script et à quoi sert-elle ?
2. Pourquoi `sh script.sh` fonctionne-t-il même si le fichier n'est pas exécutable ?
3. Comment additionner 4 à une variable entière en bash ?
4. Que vaut `$?` après un test vrai ? Après un test faux ?
5. Quelle structure choisir pour parcourir une liste connue ? Pour répéter tant qu'une condition est vraie ?
6. Que fait `shift` et pourquoi est-il nécessaire pour des arguments contenant des espaces ?
7. Comment signaler une erreur d'usage et terminer le script en échec ?
