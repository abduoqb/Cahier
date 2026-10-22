# TP 3 — Expressions régulières, grep et sed

> **Info :** Source : TP « Expressions régulières et commande grep » (questions 1 à 8), avec les feuilles `regexp.pdf` et `regex-cheatsheet-1.pdf`. Le sujet n'a pas de corrigé : les commandes sont des propositions de correction, **testées** sur des fichiers d'essai (`/etc/passwd` et `/usr/share/dict/words` réels peuvent donner plus de lignes).

## À savoir faire
- Écrire une regexp pour un format de ligne (`/etc/passwd` : champs séparés par `:`).
- Expliquer ce que sélectionne une regexp donnée (ancres, classes, `*`, `{n}`, alternatives, références arrière).
- Remettre un texte en forme avec une suite de substitutions `sed`, puis la ranger dans un script `.sed`.
- Supprimer ou extraire des lignes avec `sed` (commentaires, lignes vides, noms de classes et de méthodes).

## L'essentiel

### 1. grep sur /etc/passwd (question 1)
Format d'une ligne : `nom_utilisateur:mot_de_passe:uid:gid:commentaire:home:shell`.
```bash
grep '^man:' /etc/passwd                      # l'utilisateur man
grep '^bin:' /etc/passwd                      # l'utilisateur bin
grep -E '^([^:]*:){4}[^:]+:' /etc/passwd      # champ commentaire (le 5e) non vide
```
- `^man:` évite de sélectionner `superman` ou `manager` : l'ancre fixe le début, le `:` fixe la fin du nom.
- `([^:]*:){4}` saute les quatre premiers champs ; `[^:]+` exige au moins un caractère dans le cinquième.

### 2. Expliquer cinq commandes (question 2)
| Commande | Ce qu'elle sélectionne |
|---|---|
| `grep -E "u.*a(o\|a)"` | les mots avec un `u`, puis plus loin `ao` ou `aa` |
| `grep -E "^p[^aeiu]*n$"` | les mots qui commencent par `p`, finissent par `n`, sans `a`, `e`, `i`, `u` au milieu (le `o` et le `y` sont permis) |
| `grep -E "^[pr][^f-z]rs?i..$"` | un mot commençant par `p` ou `r`, puis une lettre hors `f` à `z`, un `r`, un `s` facultatif, un `i` et exactement deux caractères (par exemple `parsing`) |
| `grep -E "[w-z]{3}"` | les mots qui contiennent trois lettres de suite parmi `w`, `x`, `y`, `z` |
| `grep -E "(.)(.)(.)\3\2\1$"` | les mots qui **finissent** par un palindrome de six lettres (`abccba`) |

### 3. Sélections dans le dictionnaire (question 3)
```bash
grep 'ck' words                     # 1. contient ck
grep -E 'w.*w' words                # 2. au moins deux w
grep -E '^[A-Z]' words              # 3. noms propres : majuscule initiale
grep -E '^a.*ing$' words            # 4. commence par a, finit par ing
grep -E '^[aeiouy]+$' words         # 5. uniquement des voyelles
grep -E 'q([^u]|$)' words           # 6. q non suivi de u (ou q en fin de mot)
grep -E 'foo|bar' words             # 7. contient foo ou bar
grep -E '^(.)(.*\1)?$' words        # 8. même lettre au début et à la fin (un mot d'une lettre convient aussi)
```
Pour la 8, `^(.).*\1$` oublie les mots d'une seule lettre : le groupe `(.*\1)?` les accepte. Pour la 6, `q[^u]` ne voit pas un `q` placé en fin de mot.

### 4. Remettre un texte en forme avec sed (questions 4 à 6)
Règles : espaces simples ; pas d'espace avant mais un espace après `.` `,` `)` ; un espace avant mais pas après `(` ; un espace avant et après `;` `:` `?`. On procède par étapes, chaque règle sur le résultat de la précédente :
```bash
sed 's/  */ /g' texte.txt                       # espaces multiples -> un seul
sed 's/ *\([.,)]\) */\1 /g'                      # . , ) : rien avant, un espace après
sed 's/ *( */ (/g'                               # ( : un espace avant, rien après
sed 's/ *\([;:?]\) */ \1 /g'                     # ; : ? : un espace avant et après
sed 's/  */ /g;s/^ *//;s/ *$//'                  # nettoyage final
```
```pas-a-pas
{
  "titre": "Le script sed de mise en forme, règle après règle",
  "code": [
    "s/  */ /g",
    "s/ *\\([.,)]\\) */\\1 /g",
    "s/ *( */ (/g",
    "s/ *\\([;:?]\\) */ \\1 /g",
    "s/  */ /g;s/^ *//;s/ *$//"
  ],
  "etapes": [
    {"ligne":null,"vars":{"texte":"Bonjour  ,le monde  .(ceci  est  un test )et voila;ok:oui ?non"},"note":"La phrase de départ a des espaces doubles, des espaces avant la ponctuation et aucune après."},
    {"ligne":0,"vars":{"texte":"Bonjour ,le monde .(ceci est un test )et voila;ok:oui ?non"},"note":"Espaces multiples réduites à une seule."},
    {"ligne":1,"vars":{"texte":"Bonjour, le monde. (ceci est un test) et voila;ok:oui ?non"},"note":"Pour . , et ) : on retire les espaces avant et on en met une seule après (capture \\1 pour garder le caractère)."},
    {"ligne":2,"vars":{"texte":"Bonjour, le monde. (ceci est un test) et voila;ok:oui ?non"},"note":"Pour ( : une espace avant, aucune après. Ici la règle précédente avait déjà laissé la bonne forme."},
    {"ligne":3,"vars":{"texte":"Bonjour, le monde. (ceci est un test) et voila ; ok : oui ? non"},"note":"Pour ; : et ? : une espace avant et une après."},
    {"ligne":4,"vars":{"texte":"Bonjour, le monde. (ceci est un test) et voila ; ok : oui ? non"},"note":"Nettoyage final : doubles espaces éventuelles, espaces au début et à la fin de la ligne. Ici il n'y a rien à enlever."}
  ]
}
```

Question 5 : en vérifiant sur le résultat, on voit qu'un point suivi d'une parenthèse ouvrante (`.(`) donne `. (` : la règle de `.` ajoute l'espace après, celle de `(` le garantit avant. L'ordre importe et la dernière commande supprime les doublons d'espaces qu'on vient de créer.

Question 6 : on range les commandes dans un script, une par ligne, puis `sed -f forme.sed texte.txt` :
```bash
cat forme.sed
s/  */ /g
s/ *\([.,)]\) */\1 /g
s/ *( */ (/g
s/ *\([;:?]\) */ \1 /g
s/  */ /g
s/^ *//
s/ *$//
```

### 5. Effacer et filtrer (questions 7 et 8)
```bash
sed -r "/^[a-z]/d; /'s$/d" /usr/share/dict/words   # supprime les mots en minuscule et ceux qui finissent par 's : reste les noms propres
sed -r '/^bin/!d' /etc/passwd                      # supprime tout ce qui ne commence pas par bin (comme grep '^bin')
```
Sur un fichier Python `copie.txt` :
```bash
sed '/^ *#/d' copie.txt                       # 1. supprimer les commentaires d'une ligne
sed '/^$/d' copie.txt                         # 2. supprimer les lignes vides
sed -n -E 's/^class +([A-Za-z_0-9]+).*/\1/p; s/^ +def +([A-Za-z_0-9]+).*/\1/p' copie.txt   # 3. nom de la classe et des méthodes
```
Le point 3 utilise `-n` (rien n'est affiché sauf ce qui passe par `p`), un groupe de capture `\1` pour garder le nom, et deux substitutions : la ligne `class Nom...` donne `Nom`, la ligne `    def nom(...)` donne `nom`.

## Pièges fréquents
- Oublier `-E` : `|`, `+`, `?` et `{n}` deviennent des caractères littéraux avec `grep` de base.
- Oublier les ancres `^` et `$` : `grep 'man'` ramène aussi `manager` et `superman`.
- Oublier que `.` remplace n'importe quel caractère : pour un point littéral, `\.`.
- Appliquer les substitutions `sed` dans le mauvais ordre : les espaces créés par une règle sont supprimés (ou non) par la suivante.
- Oublier `-n` avec `p` : chaque ligne est affichée deux fois.
- Tester seulement sur une ligne : essayer aussi un mot d'une lettre, une ligne vide, un `q` en fin de mot.

## Questions de vérification
1. Quelle commande `grep` sélectionne les lignes de `/etc/passwd` dont le champ commentaire n'est pas vide ?
2. Que sélectionne `grep -E "(.)(.)(.)\3\2\1$"` ?
3. Quelle regexp trouve les mots qui commencent et finissent par la même lettre, mots d'une lettre compris ?
4. Pourquoi `s/  */ /g` utilise-t-il deux espaces dont le second est suivi d'une étoile ?
5. Que fait `sed -r '/^bin/!d'` ?
6. Comment extraire d'un fichier Python les noms des méthodes avec `sed` ?
