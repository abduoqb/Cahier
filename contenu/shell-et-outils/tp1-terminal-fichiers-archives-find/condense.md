# TP 1 — Terminal, fichiers, archives et find, en bref

**Méthode** : on vérifie chaque commande avec `ls`, `ls -a`, `ls -l` et `cat` avant de passer à la suivante.

| Notion | À retenir |
|---|---|
| navigation-listage | `pwd` chemin du répertoire courant ; `ls -l` (premier caractère `-` ou `d`), `ls -lh`, `ls -a`, `tree -L 2`. |
| navigation-listage | `cd dossier` entre, `cd ..` remonte, `cd` seul revient au home ; `tab` complète. |
| fichiers-repertoires | `touch` crée vide, `echo "texte" > f` ou `cat > f` écrit ; `mkdir -p a/b/c` crée tout. |
| fichiers-repertoires | `cp a* A/`, `cp -r d1 d2`, `mv A autres/`, `rm -f`, `rm -r` ; `a*` attrape aussi un répertoire `autres`. |
| fichiers-repertoires | `.[!.]*` = les noms cachés, sans `.` ni `..` ; `ls a*` liste ce qui commence par a. |
| chemins-casse-documents | Absolu depuis `/` ou `~`, relatif depuis le répertoire courant (`..` remonte). |
| chemins-casse-documents | Documents est partagé avec Windows : `toto` et `Toto` y sont le même fichier. |
| variables-path-alias | `PATH` vide : `ls` introuvable, `/bin/ls` marche. Sauvegarder avant (`sauve=$PATH`). |
| variables-path-alias | `alias ll='ls -lh'`, `alias la='ls -a'` dans `~/.bashrc`, puis `source ~/.bashrc`. |
| archives-find | `zip -r a.zip dossier`, `tar zcvf a.tgz dossier`, `unzip`, `tar xvf` ; `file` donne le vrai type. |
| archives-find | `find . -name`, `-type f`, `-type d`, `-size +1M`, `-size -50c`, `\( -name "*.jpg" -o -name "*.png" \)`. |

**Réflexe** : un joker est remplacé par le shell avant la commande ; `echo a*` montre ce que la commande recevra.
