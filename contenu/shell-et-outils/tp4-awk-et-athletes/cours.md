# TP 4 — awk et le fichier Athletes.csv

> **Info :** Source : TP5 (utilitaire awk sur `svgnam_copie.def`, puis exercice sur `Athletes.csv`, questions 1 à 10), avec `athlete_events.csv` pour tester. Le sujet n'a pas de corrigé : les commandes sont des propositions de correction, **testées** (sur `athlete_events.csv` pour la partie Athletes, sur un fichier d'essai de même format pour les couleurs).

## À savoir faire
- Expliquer une commande `awk` : condition, action, séparateur `FS`, variables `NR`, `NF`, `$n`.
- Écrire une commande `awk` de sélection, de filtre sur un nom et de comptage.
- Trouver un fichier dans une liste avec `grep -il`, retirer commentaires et guillemets avec `sed`.
- Écrire un script qui prend un argument, vérifie le nombre d'arguments et appelle `awk`.

## L'essentiel

### 1. Le fichier de couleurs (question 1)
Chaque ligne de `svgnam.def` a la forme `NomCouleur,rouge,vert,bleu;` (valeurs de 0 à 1). On prend donc `FS="[,;]"` : une virgule ou un point-virgule sépare les champs, `$1` est le nom, `$2` `$3` `$4` les composantes.

| Commande | Résultat |
|---|---|
| `awk '/Blue/ { print }' f` | les lignes contenant `Blue` |
| `awk '/^[A-Z]/ { print }' f \| head -10` | les lignes qui commencent par une majuscule, les 10 premières |
| `awk 'BEGIN{FS = "[,;]"} $2 == 0 { print $1 }' f` | le nom des couleurs sans rouge |
| `awk 'BEGIN{FS = "[,;]"} { if ($2 == 0) print $1 }' f` | la même chose, la condition étant écrite dans l'action avec `if` |
| `awk 'BEGIN{FS = "[,;]"} $2 > .9 && $3 > .9 && $4 > .9 { print $1 }' f` | les couleurs très claires : plus de 0,9 de chaque composante |
| `awk 'BEGIN{ nb = 0 } /^[A-Z]/ { nb++ } END{ print nb }' f` | le nombre de lignes qui commencent par une majuscule |

```pas-a-pas
{
  "titre": "awk : trois lignes de couleurs et la condition « claire »",
  "code": [
    "BEGIN{ FS = \"[,;]\" }",
    "$2 > .9 && $3 > .9 && $4 > .9 { print $1 }"
  ],
  "etapes": [
    {"ligne":0,"vars":{"FS":"[,;]"},"note":"Avant la première ligne : une virgule ou un point-virgule séparent les champs."},
    {"ligne":1,"vars":{"$0":"Snow,1,0.98,0.98;","$1":"Snow","$2":1,"$3":0.98,"$4":0.98,"condition":"vraie","affichage":"Snow"},"note":"Les trois composantes dépassent 0,9 : la condition est vraie, awk affiche le nom."},
    {"ligne":1,"vars":{"$0":"DarkBlue,0,0,0.545;","$1":"DarkBlue","$2":0,"$3":0,"$4":0.545,"condition":"fausse","affichage":"(rien)"},"note":"$2 vaut 0 : la première comparaison est fausse, donc toute la condition. Rien n'est affiché."},
    {"ligne":1,"vars":{"$0":"White,1,1,1;","$1":"White","$2":1,"$3":1,"$4":1,"condition":"vraie","affichage":"White"},"note":"Les trois composantes valent 1 : White est affiché. Le « ; » final fait un 5e champ vide, sans importance ici."}
  ]
}
```

### 2. Écrire des commandes (question 2)
```bash
awk 'BEGIN{FS="[,;]"} /^[A-Z]/ && $1 !~ /^(Dark|Medium)/ { print $1 }' f   # 1. ni Dark ni Medium
awk 'BEGIN{FS="[,;]"} /^[A-Z]/ && $2 == 0 && $3 == 0 { print $1 }' f       # 2. sans rouge ni vert
awk 'BEGIN{FS="[,;]"} $2 > .9 && $3 > .9 && $4 > .9 { print $1 }' f        # 3. « foncées » selon l'énoncé (plus de 0,9 partout)
awk 'BEGIN{FS="[,;]"} /^[A-Z]/ && $4 == 0 { nb++ } END{ print nb }' f      # 4. nombre sans bleu
```
- `!~` veut dire « ne correspond pas à ». Le filtre `/^[A-Z]/` écarte les lignes d'en-tête qui ne sont pas des couleurs.
- La question 3 dit « foncées » pour des valeurs supérieures à 0,9, ce qui désigne en fait des couleurs claires : on suit l'énoncé, on ne le corrige pas.
- Si aucune ligne ne convient, `nb` n'existe pas et `print nb` affiche une ligne vide ; `print nb + 0` affiche 0.

### 3. Athletes.csv : trouver le bon fichier (questions 3 à 5)
Le fichier contient des lignes de commentaires (qui commencent par `%`), puis l'en-tête `ID, Name, Sex, Age, Height, Weight, Team, NOC, Games, Year, Season, City, Sport, Event, Medal`, puis une ligne par athlète et par épreuve, séparées par des virgules.
```bash
grep -il "id" *.csv                                   # 3. fichiers contenant « id », casse ignorée
grep -il "name" $(grep -il "id" *.csv)                # 4. on restreint avec « name »...
grep -il "sex" $(grep -il "name" $(grep -il "id" *.csv))   # ...puis « sex », etc. jusqu'à un seul fichier
mv fichier5.csv Athletes.csv                          # (le nom du survivant dépend du jeu de données)
grep -n '^%' Athletes.csv                             # 5. numéros des lignes de commentaires
sed -n '3,17p' Athletes.csv > index.txt               # afficher et sauvegarder les lignes d'explication (numéros à adapter)
```
`-l` n'affiche que les noms de fichiers, `-i` ignore la casse, `$(...)` remplace la commande par sa sortie : les noms trouvés par le premier `grep` deviennent les fichiers du suivant. Le TP impose `grep`, `sed` et `awk` uniquement (pas de `xargs`).

### 4. Nettoyer le fichier (question 6)
```bash
sed '/^%/d; s/"//g' Athletes.csv > propre.csv     # supprime les commentaires et tous les guillemets
```
Sans cette étape, les champs texte sont entourés de guillemets (`"France"`) : `$7 == "France"` ne trouve alors rien.

### 5. Athlètes français (question 7)
```bash
awk -F, '$7 == "France" { print $2, $11, $10 }' propre.csv     # nom, saison, année
```
Colonnes : `$2` Name, `$7` Team, `$10` Year, `$11` Season. `-F,` est l'abréviation de `BEGIN{FS=","}`.

### 6. Script du nombre de participations (questions 8 à 10)
```bash
#!/bin/bash
# participations.sh : nombre de lignes (= participations) dont le nom contient l'argument
if (( $# != 1 )); then
    echo "Usage : $0 \"motif du nom\"" 1>&2      # message d'usage sur la sortie d'erreur
    exit 1                                       # et on quitte en échec
fi
awk -F, -v nom="$1" '$2 ~ nom { n++ } END { print n + 0 }' Athletes.csv
```
```bash
bash participations.sh "Usain.*Bolt"     # Usain Bolt a plusieurs prénoms : on cherche Usain, puis Bolt plus loin
bash participations.sh                   # sans argument : message d'usage sur la sortie d'erreur
```
Sur `athlete_events.csv` (après suppression des guillemets), `Usain.*Bolt` donne 10 lignes. Chaque ligne est une participation à une épreuve ; un athlète présent à plusieurs épreuves compte plusieurs fois.

## Pièges fréquents
- Oublier `-F,` ou `FS` sur un CSV : tout reste dans `$1`.
- Comparer `$7 == "France"` sans avoir retiré les guillemets : aucun résultat.
- Oublier `NR>1` ou le filtre `/^[A-Z]/` et traiter l'en-tête comme une donnée.
- Écrire `$2 == 0` pour « sans bleu » : le bleu est dans `$4`.
- Chercher `Usain Bolt` avec une espace : ce nom a des prénoms entre les deux.
- Oublier de vérifier `$#` : un script sans argument affiche une réponse fausse ou vide.
- Écrire le message d'usage sur la sortie standard au lieu de `1>&2`.

## Questions de vérification
1. Quelle valeur donner à `FS` pour des lignes `Nom,0.5,0.2,0.1;` ?
2. Que fait `awk '/^[A-Z]/ { nb++ } END{ print nb }'` ?
3. Quelle commande liste les `.csv` contenant `id` sans tenir compte de la casse ?
4. Pourquoi supprimer les guillemets avant d'utiliser `awk -F,` sur Athletes.csv ?
5. Comment afficher nom, saison et année des athlètes français ?
6. Que doit faire le script de participations s'il est lancé sans argument ?
