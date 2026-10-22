# TP 1 — Terminal, fichiers, archives et find

> **Info :** Sources : TP1 (démarrage, premières commandes, fichiers et répertoires, chemins, dossier Documents, éditeurs) et TP2 (variables, alias, `.bashrc`, archives, `find`). Les sujets n'ont pas de corrigé : les commandes ci-dessous sont des propositions de correction, testées dans un shell bash.

## À savoir faire
- Lire le prompt, lister (`ls` et ses options), se déplacer (`cd`, `pwd`, `tree`).
- Créer, copier, déplacer et supprimer fichiers et répertoires, avec des jokers.
- Écrire le chemin absolu puis le chemin relatif d'un même répertoire.
- Expliquer pourquoi le dossier Documents ne distingue pas les majuscules des minuscules.
- Réinitialiser le `PATH`, créer des alias et un `.bashrc`.
- Créer et extraire des archives `zip` et `tar.gz`, identifier un fichier avec `file`.
- Chercher des fichiers avec `find` selon le nom, le type et la taille.

## L'essentiel

### 1. Premières commandes (TP1, parties 1 et 2)
| Question du TP | Commande ou réponse |
|---|---|
| Sur quelle machine est-on ? Dans quel répertoire ? | le prompt `utilisateur@hôte:répertoire$` ; un `~` veut dire « dans le home » |
| chemin complet du home | `pwd` |
| lister en format long ; différence fichier / répertoire | `ls -l` : le premier caractère est `-` pour un fichier, `d` pour un répertoire |
| tailles lisibles (140K au lieu de 142786) | `ls -lh` |
| contenu de Documents sans tout taper | `ls Documents`, ou `ls D` puis la touche `tab` |
| fichiers et répertoires cachés | `ls -a` (les noms qui commencent par un point : `.bashrc`, `.mozilla`…) |
| arborescence limitée à 2 niveaux | `tree -L 2` |
| aller dans Documents, revenir au home | `cd Documents`, puis `cd` seul |

### 2. Créer des fichiers (partie 3.1)
```bash
mkdir -p systeme/tp1 ; cd systeme/tp1     # pas d'accent dans les noms
touch f1 f2 f3 f4 f5                      # cinq fichiers vides
echo "contenu de toto" > toto             # toto et Toto sont deux fichiers différents
echo "autre contenu" > Toto
touch a1 a2 a3 a4 aPartCaCaVaBien         # noms commençant par a
touch min1 min2 B3 E4 Maisaquoicasert     # noms ne commençant pas par a
for n in c1 c2 c3 c4 c5; do echo "$n" > "$n"; done   # contenu = nom du fichier
printf '12345' > e1                       # exactement 5 caractères (echo -n marche aussi)
touch .h1 .h2 .h3 .h4 .h5                 # noms commençant par un point
ls a*                                     # les fichiers commençant par a (et seulement eux)
ls -d .[!.]*                              # ceux commençant par un point
```
- `cat > monfichier` puis `Ctrl+D` écrit aussi dans un fichier (CM1). `echo "texte" > fichier` fait la même chose en une ligne.
- Linux distingue les majuscules : `toto` et `Toto` existent côte à côte ici (mais pas dans Documents, voir 5).
- `ls -d .*` affiche aussi `.` et `..` avec les bash anciens (avant la version 5.2) ; `.[!.]*` désigne un point suivi d'un caractère qui n'est pas un point, donc ni `.` ni `..`.

### 3. Répertoires, copies et jokers (partie 3.2)
```bash
mkdir A autres .Point                     # trois répertoires
mkdir -p autres/toto/titi                 # toute l'arborescence en une commande
cp a* A/                                  # copier les fichiers commençant par a dans A
cp .[!.]* .Point/                         # copier les fichiers cachés dans .Point
mv A autres/                              # déplacer A dans autres
cd .. ; cp -r tp1 tp2 ; cd tp1            # copier tout tp1 dans tp2 (placé dans systeme)
rm autres/A/a*                            # effacer les fichiers commençant par a dans A
rm -f autres/*                            # effacer les fichiers de autres sans confirmer
rm -r autres/A                            # effacer le répertoire A
rm -r autres                              # effacer autres en une seule opération
```
Sur les machines de TP, `rm` est souvent un alias de `rm -i` : il demande confirmation pour chaque fichier. `-f` supprime sans demander, `-r` descend dans les répertoires.

Le joker `a*` est remplacé par le shell **avant** de lancer `cp`, et il attrape aussi le répertoire `autres` (il commence par a) :

```pas-a-pas
{
  "titre": "cp a* A/ : ce que cp reçoit vraiment",
  "code": [
    "ls",
    "echo a*",
    "cp a* A/"
  ],
  "etapes": [
    {"ligne":0,"vars":{"contenu du répertoire":"B3 E4 a1 a2 a3 a4 aPartCa autres min1 min2"},"note":"Le répertoire contient des fichiers qui commencent par a, et un répertoire autres qui commence aussi par a."},
    {"ligne":1,"vars":{"a* devient":"a1 a2 a3 a4 aPartCa autres"},"note":"Le shell remplace a* par tous les noms qui commencent par a, répertoire compris, avant de lancer echo. echo les affiche tels quels."},
    {"ligne":2,"vars":{"cp reçoit":"a1 a2 a3 a4 aPartCa autres A/"},"note":"cp reçoit la liste déjà développée : cinq fichiers, le répertoire autres, et la destination A/."},
    {"ligne":2,"vars":{"résultat":"5 fichiers copiés dans A/"},"note":"cp copie les fichiers puis répond « omitting directory 'autres' » : sans -r, il refuse de copier un répertoire."}
  ]
}
```

### 4. Chemins absolus et relatifs (partie 3.3)
Depuis `~/systeme/tp1`, pour chaque répertoire, on liste d'abord avec un chemin relatif puis avec un chemin absolu :

| Répertoire | Relatif | Absolu |
|---|---|---|
| `.Point` | `ls .Point` | `ls ~/systeme/tp1/.Point` |
| `systeme` | `ls ..` | `ls ~/systeme` |
| `Documents` | `ls ../../Documents` | `ls ~/Documents` |
| `/tmp` | `ls ../../../../tmp` (peu pratique : on préfère l'absolu) | `ls /tmp` |

`~` est un raccourci absolu vers le home, `..` remonte d'un niveau.

### 5. Le dossier Documents ignore la casse (partie 3.4)
Documents est stocké sur des serveurs partagés avec les machines Windows de l'université. Pour rester compatible avec Windows, qui ne distingue pas `toto` de `Toto`, ce dossier ne distingue pas non plus la casse :
- `touch toto` puis `touch Toto` ne crée qu'**un seul** fichier ; le second `touch` ne fait que mettre à jour la date de modification de `toto` (visible avec `ls -l`) ;
- `rm Toto` supprime `toto` sans aucune erreur.

### 6. Éditeurs (partie 4)
On teste `nano`, `jed`, `emacs` et `vim`, on en garde un et on le met dans `EDITOR` (voir 7). Chacun a ses raccourcis pour enregistrer et quitter.

### 7. Variables, alias et .bashrc (TP2, partie 1)
```bash
echo $USER $HOME $EDITOR $PATH            # afficher des variables
export PATH=''                            # vider le PATH (sauvegarder avant : sauve=$PATH)
ls                                        # ls : command not found
/bin/ls                                   # fonctionne : chemin complet
export PATH=$sauve                        # on remet l'ancienne valeur
alias ll='ls -lh'                         # format long, tailles lisibles
alias la='ls -a'                          # fichiers et répertoires cachés
```
`/bin` contient les commandes de base (`ls`, `cp`, `cat`…). Le `PATH` dit au shell dans quels répertoires les chercher.

Pour que la configuration survive à la fermeture du terminal, on l'écrit dans `~/.bashrc` (variable `EDITOR`, alias `ll` et `la`), puis `source ~/.bashrc` la recharge sans rouvrir de terminal. Un nouveau terminal doit alors connaître les alias tout seul.

### 8. Archives et file (TP2, partie 2)
```bash
cp -r ~/systeme /tmp ; cd /tmp
zip -r systeme.zip systeme                # archive ZIP du répertoire
tar zcvf systeme.tgz systeme              # archive TAR compressée (gzip)
rm -r systeme                             # on supprime l'original...
unzip systeme.zip                         # ...et on extrait le ZIP
tar xvf systeme.tgz                       # ou l'archive TAR
file archive.zip                          # type réel du fichier téléchargé
```
Si l'extraction échoue (par exemple `unzip` sur un fichier qui n'est pas un vrai ZIP), `file` dit ce que c'est réellement (`gzip compressed data`, `POSIX tar archive`…) et on utilise la commande adaptée (`tar zxvf`, `gunzip`…).

### 9. Chercher avec find (TP2, partie 3)
```bash
find . -name "hidden-comments.php"              # par nom exact : où est-il ?
find . -type d                                  # tous les répertoires, à toute profondeur
find . -name "pa*"                              # fichiers ou répertoires commençant par pa
find . -type f -name "pa*"                      # seulement les fichiers
find . -type d -name "pa*"                      # seulement les répertoires
find . -type f -size +1M                        # plus de 1 Mo
find . -type f -size -50c                       # moins de 50 octets
find . \( -name "*.jpg" -o -name "*.png" \)     # images JPEG ou PNG
```
`-name` distingue les majuscules ; `-iname` les ignore. Les parenthèses sont échappées pour que le shell ne les prenne pas.

## Pièges fréquents
- `cp a* A/` attrape aussi le répertoire `autres` : `cp` répond « omitting directory » faute de `-r`.
- Copier un répertoire sans `-r` : `cp` refuse.
- Oublier de sauvegarder le `PATH` avant de le vider : il faut alors rouvrir un terminal.
- Mettre des accents ou des espaces dans les noms de répertoires du TP : ça complique tout.
- Croire que `toto` et `Toto` sont deux fichiers dans Documents.
- Écrire `-size +1` : sans unité, la taille est comptée en blocs de 512 octets ; il faut `M` ou `c`.

## Questions de vérification
1. Quelle commande crée `autres/toto/titi` en une fois, même si `autres` n'existe pas ?
2. Quelle commande liste les fichiers cachés, et pourquoi `ls -d .*` n'est-il pas idéal ?
3. Pourquoi `touch Toto` ne crée-t-il pas de second fichier dans Documents ?
4. Que se passe-t-il si on tape `ls` après `export PATH=''`, et pourquoi `/bin/ls` marche-t-il encore ?
5. Comment lister uniquement les fichiers de plus de 1 Mo ?
6. Quelle est la différence entre `tar zcvf` et `tar xvf` ?
