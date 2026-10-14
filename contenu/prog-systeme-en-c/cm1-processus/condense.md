# CM1 — Les processus, en bref

**Définitions**
- Processus = programme en cours d'exécution (code, données, contexte) ; PID unique, PPID = PID du père, `init` (PID 1) ancêtre de tous.
- Mode kernel : on n'y passe que par un appel système. Processus en attente d'une entrée/sortie : bloqué (`S`), sans processeur.
- `fork` : duplique le processus ; retourne PID du fils (père), 0 (fils), -1 (échec).
- `wait` : bloque le père jusqu'à la mort d'un fils, récupère son code (`WIFEXITED`, `WEXITSTATUS`). Un appel par fils.
- Zombie : fils mort, père vivant qui n'a pas lu son code. Orphelin : fils vivant, père mort, adopté par `init` (PPID 1).
- Le fils hérite d'une copie de la mémoire et des descripteurs (décalage partagé) ; nouveau PID et PPID.

**Patrons à retenir**
```text
n fork consécutifs = 2^n processus (4 fork = 16)
N processus exactement : for (i = 0; i < N-1; i++) if (fork() == 0) break;
fils : ... exit(0);        père : ... wait(&status);
```

| Piège | Bon réflexe |
|---|---|
| Compter 4 processus pour 3 fork | Les fils aussi forkent : 2^3 = 8 |
| Prédire l'ordre père/fils | Aucun ordre garanti sans `wait` |
| Fils sans `exit` | Il rejoue le code du père : terminer par `exit(0)` |
| Confondre zombie et orphelin | Zombie = fils mort ; orphelin = père mort |
| Lire `status` comme le code de sortie | Passer par `WIFEXITED` puis `WEXITSTATUS` |
| Dire que `fork` donne le PID du père au fils | Le fils reçoit 0 |
