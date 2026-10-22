# TP — Exercices : terminal, droits, filtres et scripts

> **Info :** Sources : TP1 (premières commandes, fichiers), TP2 (variables, archives, `find`), TP3 (permissions, redirections, `PATH`), TP « Expressions régulières et grep », TP5 (awk, Athletes.csv) et TP6 (scripts).

## À savoir faire
- Répondre aux questions de commandes des TP sans hésiter sur les options.
- Justifier un résultat de permissions ou de redirection.
- Écrire une commande `grep` ou `sed` à partir d'une consigne en français.
- Écrire une commande `awk` de sélection ou de comptage sur un fichier de champs.
- Écrire un petit script qui prend des arguments et traite des fichiers.

## L'essentiel

### 1. Exercices de terminal (TP1, TP2)
| Consigne | Commande |
|---|---|
| chemin complet du home | `pwd` |
| lister en détail | `ls -l` |
| tailles lisibles | `ls -lh` |
| voir les fichiers cachés | `ls -a` |
| arborescence limitée à 2 niveaux | `tree -L 2` |
| créer toute une arborescence | `mkdir -p autres/toto/titi` |
| copier les fichiers commençant par a dans A | `cp a* A/` |
| déplacer A dans autres | `mv A autres/` |
| supprimer tout un répertoire sans confirmation | `rm -r autres` |
| créer un fichier et y écrire | `cat > fichier` puis texte et `Ctrl+D` |
| type réel d'un fichier | `file archive.zip` |

Pour les fichiers cachés, `cp .* .Point/` pose problème : `.*` désigne aussi `.` et `..`. On utilise plutôt `cp .[!.]* .Point/` (ce qui laisse de côté les noms d'un seul caractère après le point).

Recherche avec `find` (TP2) :
```bash
find . -name "hidden-comments.php"      # par nom exact
find . -type d                          # tous les répertoires
find . -name "pa*" -type f              # fichiers commençant par pa
find . -type f -size +1M                # plus de 1 Mo
find . -type f -size -50c               # moins de 50 octets
find . \( -name "*.jpg" -o -name "*.png" \)   # images (parenthèses à échapper)
```

### 2. Exercices de permissions (TP3)
```text
chmod 600 fichier.txt   # lisible et modifiable par le propriétaire seul
chmod 640 fichier.txt   # propriétaire rw, groupe r, autres rien
chmod u+x script.sh     # puis ./script.sh fonctionne
```
- Répertoire `test` en `--x------` : `ls test` échoue (pas de `r`), mais `cat test/toto` fonctionne (on traverse avec `x`).
- En `-wx------` : `touch test/titi` fonctionne (droit `w`), mais `ls test` échoue toujours.
- En `rw-------` : `rm -f test/toto` échoue, car sans `x` on ne traverse pas le répertoire.
- Pour supprimer un fichier, il faut `w` **et** `x` sur le répertoire (`rwx------`).

Masque :
```text
umask 022 → répertoires 755, fichiers 644
umask 077 → répertoires 700, fichiers 600
umask 002 → répertoires 775, fichiers 664
```

### 3. Exercices de redirections (TP3)
```bash
cat texte1 > toto                  # copier
cat texte2 >> toto                 # ajouter à la fin
ls texte1 texte2 tata 2> erreurs.txt   # erreurs dans erreurs.txt
ls texte1 texte2 tata > liste.txt 2> erreurs.txt   # tout dans des fichiers
ls /usr/bin | wc -l                # compter les éléments
find /usr/bin -type l | wc -l      # compter les liens symboliques
find /usr/bin -type f | wc -l      # compter les fichiers
wc -w * | sort -n                  # mots par fichier, triés
ls /usr/bin 2> /dev/null           # jeter les erreurs
```
Rappels `PATH` : un binaire rendu exécutable dans le répertoire courant n'est trouvé que par `./myls`. Il n'est accessible par son nom seul que si son répertoire est dans le `PATH` :
```bash
export PATH=$PATH:/home/votre_id/.../executables
```
Le script `print.py` doit commencer par un shebang correct (`#!/usr/bin/env python3`) pour être lancé par `./print.py` ; c'est le rôle de `env` de trouver python3.

### 4. Exercices de grep et sed (TP regexp, TP5)
Sur `/etc/passwd` (`nom:mot_de_passe:uid:gid:commentaire:home:shell`) :
```bash
grep "^man:" /etc/passwd
grep "^bin:" /etc/passwd
grep -E "^[^:]*:[^:]*:[^:]*:[^:]*:[^:]+:" /etc/passwd   # commentaire non vide
```
Sur `/usr/share/dict/words` :
```bash
grep "ck" words                 # contient ck
grep -E "w.*w" words            # au moins deux w
grep "^[A-Z]" words             # majuscule initiale
grep -E "^a.*ing$" words        # commence par a, finit par ing
grep -E "^[aeiouy]*$" words     # uniquement des voyelles
grep -E "q[^u]" words           # q non suivi de u
grep -E "foo|bar" words         # foo ou bar
grep -E "^([a-z]).*\1$" words   # même lettre au début et à la fin
```
Remettre en forme un texte avec `sed`, en procédant par étapes :
```bash
sed 's/  */ /g' texte.txt              # espaces multiples → un seul
sed 's/ \././g; s/ ,/,/g; s/ )/)/g'    # pas d'espace avant . , )
sed 's/( /(/g'                          # pas d'espace après (
sed 's/; */ ; /g; s/ *:/ : /g'         # espace avant et après ; :
```
Nettoyer du code Python :
```bash
sed '/^#/d' copie.txt        # supprimer les commentaires
sed '/^$/d' copie.txt        # supprimer les lignes vides
sed -n 's/^class \([A-Za-z_]*\).*/\1/p; s/^ *def \([A-Za-z_]*\).*/\1/p' copie.txt
```
Sur Athletes.csv, en utilisant seulement grep, sed et awk :
```bash
grep -il "id" *.csv                     # fichiers contenant id, sans tenir compte de la casse
sed '/^%/d; s/"//g' Athletes.csv        # enlever commentaires et guillemets
awk -F, '$7 == "France" { print $2, $11, $10 }' Athletes.csv   # nom, saison, année
```

### 5. Exercices awk (TP5)
Commandes du TP sur `svgnam_copie.def`, à savoir expliquer :
- `awk '/Blue/ { print }' fichier` : affiche les lignes contenant Blue.
- `awk '/^[A-Z]/ { print }' fichier | head -10` : lignes commençant par une majuscule, limitées à 10.
- `awk 'BEGIN{FS="[,;]"} $2 == 0 { print $1 }' fichier` : premier champ des lignes dont le 2e champ vaut 0.
- `awk 'BEGIN{FS="[,;]"} { if ($2 == 0) print $1 }' fichier` : même résultat, condition écrite dans l'action.
- `awk 'BEGIN{FS="[,;]"} $2 > .9 && $3 > .9 && $4 > .9 { print $1 }' fichier` : noms des couleurs « foncées ».
- `awk 'BEGIN{ nb = 0 } /^[A-Z]/ { nb++ } END{ print nb }' fichier` : compte les lignes commençant par une majuscule.

Réponses aux questions :
```bash
awk 'BEGIN{FS="[,;]"} $1 !~ /^(Dark|Medium)/ { print $1 }' fichier   # ni Dark ni Medium
awk 'BEGIN{FS="[,;]"} $2 == 0 && $3 == 0 { print $1 }' fichier       # sans rouge ni vert
awk 'BEGIN{FS="[,;]"} $2 > .9 && $3 > .9 && $4 > .9 { print $1 }' fichier
awk 'BEGIN{FS="[,;]"} $4 == 0 { nb++ } END{ print nb }' fichier      # sans bleu
```

### 6. Exercices de scripts (TP6)
```bash
#!/bin/bash
# créer un dossier et des fichiers, avec sauvegarde et vérification des arguments
usage="Usage : $0 dossier nom1 [nom2 ...]"
if (( $# < 2 )); then
    echo "$usage" 1>&2
    exit 1
fi
dossier="$1"
shift
if [ -d "$dossier" ]; then
    echo "Le dossier $dossier/ existe"
else
    mkdir "$dossier"
    echo "Dossier $dossier/ créé"
fi
echo "Il y a $# fichiers à créer"
while [ -n "$1" ]; do
    f="$dossier/$1.txt"
    [ -f "$f" ] && cp "$f" "$f.old"
    echo "$1" > "$f"
    shift
done
```
Points d'exercice : `[ -f "$f" ] && cp` évite le message d'erreur sur un fichier absent ; les guillemets autour de `"$1"` et `"$dossier"` gèrent les espaces ; `while` + `shift` conserve les arguments entiers.

Rangement de fichiers (TP6) :
```bash
for f in $(find vrac -name "*.py"); do
    echo "Copie de $f"
    cp "$f" rangement/python/
done
find vrac -type f | wc -l          # nombre total de fichiers
find vrac -name "*.java" | wc -l   # nombre de fichiers Java
```
Pour éviter d'écraser un fichier de même nom, on renomme avec `$RANDOM` ; pour ne pas recopier un doublon identique, `diff -q fichier1 fichier2` compare les contenus.

## Pièges fréquents
- `cp .*` inclut `.` et `..` : filtrer avec `.[!.]*` ou un motif plus précis.
- Oublier `-r` dans `cp` ou `rm` sur un répertoire.
- Croire que `ls` d'un répertoire en `--x` fonctionne : il faut `r`.
- Croire qu'on supprime un fichier en changeant ses droits : c'est `w` et `x` sur le répertoire.
- Mettre un espace entre `2` et `>` dans une redirection d'erreur.
- Oublier `-E` pour `|`, `+`, `?` dans grep et sed.
- Oublier `NR>1` avec un fichier CSV qui a un en-tête.
- Utiliser `for f in $@` au lieu de `while` + `shift`.
- Oublier les guillemets autour des variables de chemin : un espace casse la commande.
- Afficher un message d'usage sur la sortie standard au lieu de la sortie d'erreur.

## Questions de vérification
1. Quelle commande crée `autres/toto/titi` en une fois ?
2. Comment supprimer `test/toto` si `test` est en `rw-------` ?
3. Que fait `ls ... > liste.txt 2> erreurs.txt` ?
4. Écrire la commande qui compte les répertoires de `/usr/bin`.
5. Écrire la commande grep qui trouve les mots finissant par `ing` et commençant par `a`.
6. Écrire la commande awk qui compte les couleurs sans bleu.
7. Pourquoi `while [ -n "$1" ]` avec `shift` vaut mieux que `for x in $@` ?
