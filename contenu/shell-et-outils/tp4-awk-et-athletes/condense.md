# TP 4 — awk et le fichier Athletes.csv, en bref

**Méthode** : on nettoie d'abord le fichier (commentaires, guillemets), puis on choisit le bon séparateur, la bonne colonne, et on teste sur quelques lignes.

| Notion | À retenir |
|---|---|
| awk-couleurs | Lignes `Nom,r,v,b;` : `FS="[,;]"`, `$1` nom, `$2` rouge, `$3` vert, `$4` bleu. |
| awk-couleurs | `/Blue/`, `/^[A-Z]/` : conditions par regexp ; `$2 == 0` ; `$2 > .9 && $3 > .9` ; `!~` = ne correspond pas. |
| awk-comptage | `{ nb++ } END{ print nb }` compte ; `print nb + 0` affiche 0 si rien ne correspond. |
| athletes-grep-sed | `grep -il mot *.csv` liste les fichiers ; `$(...)` enchaîne les filtres ; `sed -n 'a,bp'` extrait des lignes. |
| athletes-grep-sed | `sed '/^%/d; s/"//g'` retire commentaires et guillemets. |
| athletes-awk | Colonnes : `$2` Name, `$7` Team, `$10` Year, `$11` Season ; `awk -F, '$7 == "France" { print $2, $11, $10 }'`. |
| athletes-script | `$# != 1` → usage sur `1>&2` et `exit 1` ; `awk -F, -v nom="$1" '$2 ~ nom { n++ } END { print n + 0 }'`. |

**Piège central** : avec les guillemets d'origine, `$7 == "France"` ne trouve rien.
