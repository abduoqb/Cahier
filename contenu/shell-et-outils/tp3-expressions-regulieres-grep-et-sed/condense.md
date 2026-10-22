# TP 3 — Expressions régulières, grep et sed, en bref

**Méthode** : on écrit la regexp sur un exemple, on la teste sur des cas limites (mot d'une lettre, ligne vide, fin de ligne), puis on la généralise.

| Notion | À retenir |
|---|---|
| grep-passwd | `/etc/passwd` : `nom:mdp:uid:gid:commentaire:home:shell` ; `grep '^man:'`, `grep -E '^([^:]*:){4}[^:]+:'`. |
| grep-explications | `[^aeiu]*` = rien d'autre que ces lettres ; `(.)(.)(.)\3\2\1$` = fin de mot palindrome de 6 lettres. |
| grep-dictionnaire | `ck`, `w.*w`, `^[A-Z]`, `^a.*ing$`, `^[aeiouy]+$`, `q([^u]\|$)`, `foo\|bar`, `^(.)(.*\1)?$`. |
| sed-mise-en-forme | Règles dans l'ordre : espaces multiples, `. , )`, `(`, `; : ?`, nettoyage ; `sed -f forme.sed`. |
| sed-effacement | `/^ *#/d` commentaires, `/^$/d` lignes vides, `/^bin/!d` garde ce qui commence par bin. |
| sed-effacement | `sed -n -E 's/^class +([A-Za-z_0-9]+).*/\1/p; s/^ +def +([A-Za-z_0-9]+).*/\1/p'` extrait classe et méthodes. |

**Piège central** : sans `-E`, `|`, `+`, `?` et `{n}` sont littéraux ; sans ancres, `man` ramène `manager`.
