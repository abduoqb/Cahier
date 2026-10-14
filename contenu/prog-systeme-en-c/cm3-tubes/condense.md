# CM3 — Les tubes, en bref

**Définitions**
- Tube anonyme : file d'octets FIFO à sens unique dans le noyau. `fd[0]` lit, `fd[1]` écrit. Sans nom : accessible par héritage (`pipe` AVANT `fork`).
- Tube nommé (FIFO) : même tube avec un nom dans le système de fichiers (`mkfifo`, `p` dans `ls -l`) : processus sans parenté. Taille 0, données dans le noyau.
- `dup2(old, new)` : `new` devient une copie de `old` ; sert à rediriger `STDIN`/`STDOUT` avant `exec`.
- `SIGPIPE` : écriture dans un tube sans lecteur ; tue le processus (sinon `write` rend -1, `EPIPE`).
- Mémoire partagée : le plus rapide, aucune synchronisation fournie ; `shmget`, `shmat`, `shmdt`, `shmctl(IPC_RMID)`.

**Patrons à retenir**
```text
pipe(fd) ; fork()
écrivain : close(fd[0]) ; write(fd[1], ...) ; close(fd[1])
lecteur  : close(fd[1]) ; read(fd[0], ...) ; close(fd[0])
redirection : dup2(fd[1], STDOUT_FILENO) ; close(fd[0]) ; close(fd[1]) ; exec
```
- `read` sur tube vide : bloque s'il reste un écrivain, rend 0 sinon. `write` sur tube plein : bloque.
- Deux sens : deux tubes. `p1 | p2 | p3` : 2 tubes.

| Piège | Bon réflexe |
|---|---|
| `fork` avant `pipe` | Créer le tube avant : le fils hérite des descripteurs |
| Garder un bout inutile ouvert | Chaque processus ferme le bout qu'il n'utilise pas |
| `read` qui ne rend jamais 0 | Chercher un `fd[1]` resté ouvert (père, original après `dup2`) |
| Père et fils ferment `fd[0]`, le fils écrit | `SIGPIPE` tue le fils : garder le bout du lecteur |
| Tube sans parenté en anonyme | Tube nommé (`mkfifo`, `open`, `unlink`) |
| Croire le tube stocké sur disque | Taille 0, tampon en mémoire du noyau |
| Afficher sans `'\0'` | Utiliser le retour de `read` |
