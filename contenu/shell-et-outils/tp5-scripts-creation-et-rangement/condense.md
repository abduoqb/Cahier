# TP 5 — Scripts : création de fichiers et rangement, en bref

**Méthode** : on part d'une boucle qui marche, puis on ajoute une amélioration à la fois (sauvegarde, test du dossier, arguments, vérification, espaces) en relançant le script à chaque fois.

| Notion | À retenir |
|---|---|
| script-arguments | `$#` compte, `$1` premier ; `shift` pour passer à la suite ; usage sur `1>&2` puis `exit 1`. |
| script-tests-sauvegarde | `[[ -d "$d" ]]` pour le dossier, `[[ -e "$f" ]] && cp "$f" "$f.old"` pour la sauvegarde. |
| script-espaces | Guillemets partout (`"$1"`, `"$dossier"`) ; `for x in $@` coupe, `while [[ -n "$1" ]]` + `shift` ou `for x in "$@"` non. |
| find-vrac | `find vrac -type f \| wc -l`, `-name "*.java"`, `\( -name "*.jpg" -o -name "*.png" \)`, `-name "* *"`, `-iname`. |
| rangement-doublons | `find ... \| while IFS= read -r f`, `basename`, `diff -q`, `$RANDOM` ; ne jamais écraser. |

**Piège central** : `for f in $(find ...)` coupe un nom contenant une espace en plusieurs morceaux.
