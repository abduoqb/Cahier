# TP 5 — Scripts : création de fichiers et rangement

> **Info :** Source : TP6 (exercice 1 : création de dossier et de fichiers ; exercice 2 : faire du rangement, avec `find`). Le sujet n'a pas de corrigé : les scripts sont des propositions de correction, **exécutés** dans un shell bash, y compris avec des noms contenant des espaces.

## À savoir faire
- Écrire un script qui crée un dossier et des fichiers à partir de ses arguments.
- Vérifier le nombre d'arguments, écrire l'usage sur la sortie d'erreur, quitter en échec.
- Gérer les noms avec espaces : guillemets partout et `while` + `shift`.
- Utiliser `find` pour compter ou filtrer, et parcourir ses résultats dans un script.
- Copier sans écraser, détecter un doublon avec `diff`.

## L'essentiel

### 1. Exercice 1, de la boucle au script complet
Version de départ (questions 1 à 4) :
```bash
#!/bin/bash
mkdir exo1
for mot in toto tata titi tutu; do
    echo "$mot est le nom de ce fichier" > "exo1/$mot.txt"
done
```
Puis on améliore, étape par étape :
- **Relance (question 5)** : le dossier existe déjà, `mkdir` se plaint, les fichiers sont écrasés. Avant d'écrire, on sauvegarde : `[[ -e "$fichier" ]] && cp "$fichier" "$fichier.old"`.
- **Dossier seulement s'il manque (question 6)** : `if [[ -d exo1 ]]; then echo "Le dossier exo1/ existe"; else mkdir exo1; echo "Dossier exo1/ créé"; fi`.
- **Noms en argument (questions 7 et 8)** : le premier argument est le dossier, les suivants sont les fichiers ; `$#` donne le nombre d'arguments restants après un `shift`.
- **Vérification (question 9)** : au moins deux arguments, sinon message d'usage **sur la sortie d'erreur** et `exit 1`. Pour vérifier qu'il est bien sur la sortie d'erreur : `bash 01-exo1.sh 2>/dev/null` n'affiche plus rien, alors que `bash 01-exo1.sh 2>&1 >/dev/null` l'affiche.

Version finale (testée) :
```bash
#!/bin/bash
# Usage : bash 01-exo1.sh dossier nom1 [nom2 ...]
usage="Usage : $0 dossier nom1 [nom2 ...]"
if (( $# < 2 )); then
    echo "$usage" 1>&2
    exit 1
fi

dossier="$1"
shift
if [[ -d "$dossier" ]]; then
    echo "Le dossier $dossier/ existe"
else
    mkdir "$dossier"
    echo "Dossier $dossier/ créé"
fi

echo "Il y a $# fichiers à créer"
while [[ -n "$1" ]]; do
    fichier="$dossier/$1.txt"
    if [[ -e "$fichier" ]]; then
        cp "$fichier" "$fichier.old"      # sauvegarde si le fichier existe déjà
    fi
    echo "$1 est le nom de ce fichier" > "$fichier"
    shift
done
```
```bash
bash 01-exo1.sh "to to" lala "ma ma" "mo mi mu"
# crée le dossier « to to » et les fichiers lala.txt, « ma ma.txt » et « mo mi mu.txt »
```

### 2. Les espaces dans les noms (questions 10 à 14)
- Sans guillemets autour de `$dossier`, `mkdir to to` crée **deux** dossiers, `to` et `to`. Avec `"$dossier"`, le dossier s'appelle bien `to to`.
- Avec `for nom in $@`, l'argument `"ma ma"` est coupé en deux mots : `ma.txt` est créé deux fois, d'où un `ma.txt.old`. Avec `echo $1 $2` puis `echo $nom` dans la boucle, on voit la différence (`$1` garde l'espace, `$nom` non).
- Deux solutions testées : `while [[ -n "$1" ]]` avec `shift`, ou `for nom in "$@"` (avec guillemets).
- Un nom pour lequel la création échoue : `../../../../../etc/x`. Le script cherche à écrire `exo1/../../../../../etc/x.txt`, donc en dehors du répertoire personnel, et `bash` répond `Permission denied`.

```pas-a-pas
{
  "titre": "Rangement : copier, détecter un doublon ou renommer",
  "code": [
    "nom=$(basename \"$f\")",
    "cible=\"rangement/python/$nom\"",
    "if [[ ! -e \"$cible\" ]]; then cp \"$f\" \"$cible\"",
    "elif diff -q \"$f\" \"$cible\" > /dev/null; then echo \"!!!! Fichier identique à $cible !!!!\"",
    "else cp \"$f\" \"rangement/python/$(basename \"$nom\" .py)-$RANDOM.py\""
  ],
  "etapes": [
    {"ligne":0,"vars":{"f":"vrac/lundi/divers/__init__.py","nom":"__init__.py"},"note":"Premier fichier trouvé par find : basename garde seulement le nom."},
    {"ligne":2,"vars":{"cible":"rangement/python/__init__.py","résultat":"copié tel quel"},"note":"La cible n'existe pas encore : on copie sans rien changer."},
    {"ligne":0,"vars":{"f":"vrac/mardi/__init__.py","nom":"__init__.py"},"note":"Un second __init__.py, trouvé dans un autre dossier : même nom."},
    {"ligne":3,"vars":{"résultat":"identique : pas de copie"},"note":"La cible existe, mais diff -q ne trouve aucune différence (code 0) : c'est un doublon, on affiche le message sans recopier."},
    {"ligne":0,"vars":{"f":"vrac/mon dossier/models.py","nom":"models.py"},"note":"Un fichier models.py : le nom contient une espace dans son chemin, mais find ... | while read le conserve entier."},
    {"ligne":2,"vars":{"cible":"rangement/python/models.py","résultat":"copié tel quel"},"note":"Aucun models.py dans rangement/python : on copie."},
    {"ligne":0,"vars":{"f":"vrac/mardi/models.py","nom":"models.py"},"note":"Un autre models.py, de contenu différent cette fois."},
    {"ligne":4,"vars":{"résultat":"copié sous models-4601.py"},"note":"La cible existe et diff -q trouve une différence : on ne l'écrase pas, on copie avec un nombre aléatoire dans le nom."}
  ]
}
```

### 3. Exercice 2, préliminaire avec find
```bash
find vrac -type f                            # 1. tous les fichiers
find vrac -type f | wc -l                    # 2. leur nombre
find vrac -name "__init__.py"                # 3. les fichiers Python __init__.py
find vrac -name "*.php"                      # 4. les fichiers PHP
find vrac -name "*.java" | wc -l             # 5. le nombre de fichiers Java
find vrac \( -name "*.jpg" -o -name "*.png" \)   # 6. les images
find vrac -name "* *"                        # 7. les noms contenant au moins une espace
```
`-iname` fonctionne comme `-name` mais ignore la casse (`*.JPG` et `*.jpg`).

### 4. Exercice 2, le script de rangement
On crée `exo2/rangement/python`, `java` et `images`, puis on copie les fichiers Python sans rien écraser et sans recopier les doublons :
```bash
#!/bin/bash
# Copie tous les fichiers Python de vrac/ dans rangement/python/ sans rien écraser.
find vrac -name "*.py" | while IFS= read -r f; do
    nom=$(basename "$f")
    cible="rangement/python/$nom"
    echo "Copie de $f"
    if [[ ! -e "$cible" ]]; then
        cp "$f" "$cible"
    elif diff -q "$f" "$cible" > /dev/null; then
        echo "!!!! Fichier identique à $cible !!!!"
    else
        cp "$f" "rangement/python/$(basename "$nom" .py)-$RANDOM.py"
    fi
done
```
- La version de départ du TP (`for f in $(find ...)`) casse sur les noms avec espaces, justement présents dans `vrac` : `find ... | while IFS= read -r f` lit une ligne entière à chaque tour.
- Plusieurs `__init__.py` dans `rangement/python/` sont normaux quand leurs contenus diffèrent : sans le renommage aléatoire, le second écraserait le premier.
- `basename chemin` extrait le nom du fichier ; `basename nom .py` retire en plus le suffixe ; `$RANDOM` est un entier aléatoire ; `diff -q a b` ne dit que « différents » ou rien (code de retour 0 si identiques).
- Limite : le doublon n'est comparé qu'au fichier de même nom d'origine, pas aux copies renommées avec `$RANDOM`.

## Pièges fréquents
- Oublier les guillemets autour de `"$1"`, `"$dossier"`, `"$f"` : un espace casse la commande.
- Boucler avec `for x in $@` (sans guillemets) : les arguments avec espaces sont coupés.
- Écrire le message d'usage sur la sortie standard au lieu de `1>&2`.
- `for f in $(find ...)` : les noms contenant des espaces sont coupés en morceaux.
- Oublier `exit 1` après l'usage : le script continue avec des arguments manquants.
- Copier sans tester l'existence : le second fichier de même nom écrase le premier.

## Questions de vérification
1. Comment vérifier que l'usage est bien écrit sur la sortie d'erreur ?
2. Pourquoi `bash script.sh "to to" lala` ne crée-t-il pas le bon dossier sans guillemets dans le script ?
3. Quelle boucle sur les arguments respecte les espaces ?
4. Comment un script détecte-t-il qu'un fichier de même nom a déjà le même contenu ?
5. Pourquoi plusieurs `__init__.py` peuvent-ils légitimement exister dans `rangement/python/` ?
6. Quelle commande `find` liste les fichiers dont le nom contient une espace ?
