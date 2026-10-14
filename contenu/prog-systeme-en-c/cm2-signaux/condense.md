# CM2 — Les signaux, en bref

**Définitions**
- Signal = événement **asynchrone** sans donnée, envoyé par le noyau, le clavier ou un processus (`kill`).
- États : **pendant** (un seul exemplaire par type), **délivré** (retour noyau vers utilisateur), **bloqué** (masque).
- Trois réactions : `SIG_DFL` (défaut), `SIG_IGN` (ignorer), handler `void f(int sig)`.
- `SIGKILL` (9) et `SIGSTOP` (19) : ni interceptés, ni ignorés, ni bloqués.
- Repères : `SIGINT` 2 (Ctrl-C), `SIGFPE` 8, `SIGSEGV` 11, `SIGPIPE` 13, `SIGTERM` 15, `SIGCHLD` 17.

**Patrons à retenir**
```c
act.sa_handler = f; sigemptyset(&act.sa_mask); act.sa_flags = 0;
sigaction(SIGINT, &act, NULL);              // installer un handler
sigprocmask(SIG_BLOCK, &s, NULL);           // bloquer AVANT le fork / l'attente
sigsuspend(&vide);                          // débloquer + dormir, atomique
```
- `kill(pid, sig)` : `pid>0` un processus, `0` son groupe, `-1` tous, `<-1` le groupe `-pid`.
- Dans un handler : `write`, `_exit`, `volatile sig_atomic_t`. Pas de `printf` / `malloc`.

| Piège | Bon réflexe |
|---|---|
| Croire que `kill` tue | `kill` envoie ; la réaction décide |
| `signal()` portable | Utiliser `sigaction` (comportement POSIX fiable) |
| `while(!recu) pause();` | Bloquer le signal puis `sigsuspend` (pas de signal perdu) |
| `sleep(1)` pour synchroniser père et fils | Handler et blocage installés avant le `fork` |
| Handler de `SIGSEGV` / `SIGFPE` qui retourne | Boucle infinie : quitter (`_exit`) ou `siglongjmp` |
| Compter 3 signaux identiques envoyés d'affilée | Un seul est pendant : le reste est perdu |
| Oublier de récolter les fils | `SIGCHLD` puis `waitpid(-1, NULL, WNOHANG)` en boucle |
| Écrire dans un tube sans lecteur | `SIGPIPE` tue ; sinon `SIG_IGN` et tester `write` (`EPIPE`) |
