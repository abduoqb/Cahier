# CM4 — Les threads, en bref

**Définitions**
- Thread : fil d'exécution dans un processus. Au moins 1 (le `main`). Même PID pour tous, SPID différents (`ps -jfT`).
- Partagés : code, globales, tas, fichiers ouverts. Propres : pile et registres.
- Section critique : code qui touche une ressource partagée. Mutex : un seul thread à la fois dedans.
- Condition de concurrence : résultat qui dépend de l'ordre d'exécution (l'ordonnanceur coupe n'importe où).
- Sémaphore : compteur de N places (P bloque à 0, V réveille) ; mutex = sémaphore binaire.

**Patrons à retenir**
```c
void *f(void *arg) { ... return NULL; }        // 1 void * en entrée, 1 void * en sortie
pthread_create(&t, NULL, f, &donnee);          // 0 si OK, code d'erreur sinon
pthread_join(t, &ret);                         // attend la fin (comme wait)
pthread_mutex_lock(&m); /* section critique */ pthread_mutex_unlock(&m);
```
- Compiler avec `-pthread`. N threads : une boucle de `create`, puis une boucle de `join`.
- Combien de threads : nombre de `pthread_create` + 1 (le principal).
- fork copie la mémoire ; pthread_create la partage.

| Piège | Bon réflexe |
|---|---|
| Oublier le thread principal dans le comptage | create + 1 |
| `main` finit sans `join` | Le processus s'arrête et tue les threads : `join` chacun |
| `exit()` dans un thread | Tue tout le processus ; utiliser `return` / `pthread_exit` |
| Passer `&i` de la boucle `for` | Un tableau `data[i]` ou un `malloc` par thread |
| Renvoyer l'adresse d'une variable locale | `malloc` dans le thread, `free` dans `main` |
| `lock` sans `unlock` | Les autres attendent à jamais : toujours déverrouiller |
| Mutex local à chaque thread | Global et partagé par tous |
| Attendre un ordre d'affichage fixe | Non déterministe : l'ordonnanceur décide |
