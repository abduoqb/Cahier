# TP 2 — Permissions, redirections et PATH

> **Info :** Source : TP3 (installation, permissions, masque de création, redirections d'entrées-sorties, exécutables et `PATH`). Le sujet n'a pas de corrigé : les commandes ci-dessous sont des propositions de correction. Les droits ont été relus avec le cours (CM2) ; les redirections et les tubes ont été exécutés dans un shell bash.

## À savoir faire
- Changer des droits en symbolique et en octal, et prévoir ce que donne un répertoire sans `r`, sans `w` ou sans `x`.
- Calculer les droits des fichiers et répertoires créés avec un masque donné.
- Rediriger la sortie standard, la sortie d'erreur, séparément ou ensemble.
- Compter avec `wc` et un tube, compter des types de fichiers avec `find`.
- Expliquer pourquoi `myls` ne marche que depuis son répertoire tant qu'il n'est pas dans le `PATH`.

## L'essentiel

### 1. Installation (partie 1)
```bash
mkdir -p ~/systeme ; cd ~/systeme     # on crée le dossier s'il n'existe pas
# on place l'archive téléchargée ici, puis on l'extrait (zip ou tar selon file) :
unzip tp3.zip                         # crée le répertoire tp3
rm tp3.zip ; cd tp3                   # on supprime l'archive et on entre dans tp3
```

### 2. Permissions (partie 2)
Chaque changement s'écrit en symbolique et en octal :

| Consigne | Symbolique | Octal |
|---|---|---|
| `fichier.txt` lisible et modifiable par le propriétaire seul | `chmod u=rw,go= fichier.txt` | `chmod 600 fichier.txt` |
| propriétaire rw, groupe r, autres rien | `chmod u=rw,g=r,o= fichier.txt` | `chmod 640 fichier.txt` |
| rendre `script.sh` exécutable | `chmod u+x script.sh` | `chmod 700 script.sh` (si on part de 600) |

- `sh script.sh` exécute le fichier même sans droit `x` (le shell le lit comme un fichier ordinaire). `./script.sh` exige le droit `x` : sans lui, `Permission denied`.

Les droits d'un **répertoire** `test` contenant `toto` (TP3 en donne la liste) :

| Droits de `test` | `ls test` | `cat test/toto` | `touch test/titi` | `rm -f test/toto` |
|---|---|---|---|---|
| `--x------` | échoue (pas de `r`) | marche (on traverse avec `x`) | échoue (pas de `w`) | échoue (pas de `w`) |
| `-wx------` | échoue (pas de `r`) | marche | marche (`w` et `x`) | marche |
| `rw-------` | marche pour les noms, mais pas les détails | échoue (pas de `x`) | échoue (pas de `x`) | échoue (pas de `x`) |
| `rwx------` | marche | marche | marche | marche |

Règle : pour supprimer un fichier, il faut `w` **et** `x` sur le répertoire qui le contient ; les droits du fichier lui-même n'y changent rien. Pour lister, `r` ; pour traverser, `x`.

### 3. Masque de création
```bash
umask                   # affiche le masque ; 0022 donne répertoires 755, fichiers 644
umask 077               # fichiers rw-------, répertoires rwx------
umask 0022              # on remet la valeur par défaut
```
Pour obtenir `rw-------` pour les fichiers et `rwx------` pour les répertoires, il faut retirer tout au groupe et aux autres : masque `077`. Le `x` n'est jamais donné par défaut aux fichiers, d'où `rw-` et non `rwx`. Attention : le masque reste actif pour tout ce que ce terminal crée ensuite (le sujet prévient que cela peut affecter le compte) : on le remet à la fin.

### 4. Redirections (partie 3)
```bash
cat texte1                                  # 1. afficher
cat texte1 > toto                           # 2. copier texte1 dans toto
cat texte2 >> toto                          # 3. ajouter texte2 à la fin de toto
ls texte1 texte2 tata texte3 texte4 text textA texte6 blabla      # 4. trouvés à l'écran, erreurs aussi
ls texte1 texte2 tata texte3 texte4 text textA texte6 blabla 2> erreurs.txt              # 5.
ls texte1 texte2 tata texte3 texte4 text textA texte6 blabla > liste.txt 2> erreurs.txt  # 6. rien à l'écran
ls /usr/bin/                                # 7. lister
ls /usr/bin/ | wc -l                        # 8. nombre d'éléments
find /usr/bin -type l | wc -l               # 9. liens symboliques ; -type f : fichiers ; -type d : répertoires
wc -w *                                     # 10. nombre de mots de chaque fichier de text/
wc -w * | sort -n                           # 11. dans l'ordre croissant
```
- Question 5 : les fichiers trouvés restent sur la sortie standard (l'écran), les messages d'erreur vont dans `erreurs.txt`.
- Question 6 : les deux flux partent dans des fichiers, il ne reste rien à l'écran.

```pas-a-pas
{
  "titre": "ls f1 tata blabla > liste.txt 2> erreurs.txt : les trois descripteurs",
  "code": [
    "ls f1 tata blabla > liste.txt 2> erreurs.txt"
  ],
  "etapes": [
    {"ligne":0,"note":"Au départ, les trois descripteurs du processus pointent vers le terminal : clavier pour l'entrée, écran pour les deux sorties.","schema":{"type":"tableau","cases":["tty","tty","tty"],"marques":{"stdin":0,"stdout":1,"stderr":2}}},
    {"ligne":0,"vars":{"sortie standard":"liste.txt"},"note":"> liste.txt : le shell crée le fichier et branche le descripteur 1 dessus. Les noms trouvés n'iront plus à l'écran.","schema":{"type":"tableau","cases":["tty","liste","tty"],"marques":{"stdin":0,"stdout":1,"stderr":2},"surligne":[1]}},
    {"ligne":0,"vars":{"sortie d'erreur":"erreurs.txt"},"note":"2> erreurs.txt : le descripteur 2 (sortie d'erreur) part dans un autre fichier.","schema":{"type":"tableau","cases":["tty","liste","err"],"marques":{"stdin":0,"stdout":1,"stderr":2},"surligne":[2]}},
    {"ligne":0,"vars":{"à l'écran":"rien"},"note":"ls s'exécute : f1, s'il existe, est écrit dans liste.txt ; les messages « No such file or directory » pour tata et blabla vont dans erreurs.txt. Rien n'apparaît à l'écran.","schema":{"type":"tableau","cases":["tty","liste","err"],"marques":{"stdin":0,"stdout":1,"stderr":2},"fixes":[1,2]}}
  ]
}
```

### 5. Exécutables et PATH (partie 4)
```bash
chmod u+x myls ; ./myls                     # 1. rendre exécutable et lancer : marche avec ./
myls                                        # 2. depuis ailleurs : command not found
python3 print.py                            # 3. marche : on donne le fichier à python3
./print.py                                  # 4. après chmod u+x : échoue si le shebang vise un mauvais interpréteur
```
- Avec `./print.py`, c'est la première ligne (shebang) qui dit quel programme lance le fichier. Si elle contient `#!/usr/bin/python` et que seul `python3` existe, le shell répond `bad interpreter`. On corrige avec `#!/usr/bin/env python3` : `env` retrouve `python3` dans le `PATH`.
- `gcc hello.c -o hello` produit un exécutable dont les droits `x` sont déjà posés ; `./hello` le lance.
- Depuis un autre répertoire, `myls`, `print.py` et `hello` sont introuvables tant que leur dossier n'est pas dans le `PATH`.
```bash
pwd                                         # 9. on copie le chemin affiché
export PATH=$PATH:/home/votre_id/.../executables      # 10. on l'ajoute au PATH (ou : export PATH=$PATH:$PWD)
cd ; myls ; print.py ; hello                # 11. maintenant le shell les trouve
```
`export PATH=$PATH:...` ajoute à la fin de la liste existante ; `export PATH=...` sans `$PATH:` la remplacerait.

## Pièges fréquents
- Croire que `chmod 777` règle un problème de droits : on ouvre tout à tout le monde.
- Oublier `x` sur un répertoire : on ne peut plus rien y atteindre, même un fichier lisible.
- Penser qu'on supprime un fichier grâce aux droits du fichier : ce sont ceux du répertoire.
- Oublier de remettre le masque : il reste actif pour tout ce que le terminal crée ensuite. Terminer par `umask 0022`.
- Écrire `2 > erreurs.txt` avec un espace : `2` devient un argument.
- Écrire `cmd 2>&1 > f` : les erreurs partent à l'écran ; l'ordre correct est `cmd > f 2>&1`.
- Lancer `./hello` depuis un autre dossier, ou `hello` sans ajouter son dossier au `PATH`.
- Écrire `export PATH=/chemin` et perdre tout l'ancien `PATH`.

## Questions de vérification
1. Quel octal correspond à `rw-r-----` ? Et à `rwx------` ?
2. Un répertoire est en `-wx------` : que peut-on y faire ?
3. Quel masque donne `rw-------` aux fichiers et `rwx------` aux répertoires ?
4. Comment afficher les fichiers trouvés à l'écran et écrire les erreurs dans `erreurs.txt` ?
5. Comment compter les liens symboliques de `/usr/bin` ?
6. Pourquoi `myls` ne marche-t-il pas depuis un autre répertoire, et comment corriger ?
