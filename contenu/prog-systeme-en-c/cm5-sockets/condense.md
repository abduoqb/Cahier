# CM5 — Les sockets, en bref

**Définitions**
- Socket : descripteur de fichier (système) ; point de communication IP + port + protocole (réseau) ; bidirectionnelle. Fichier `s` de taille 0 en local.
- Serveur TCP : `socket`, `bind`, `listen`, `accept`, `read/write`, `close`. Client : `socket`, `connect`, `write/read`, `close`.
- `accept` bloque et renvoie une nouvelle socket de service ; la socket d'écoute reste pour les autres clients.
- UDP : pas de `listen` / `accept` / `connect` ; `sendto` / `recvfrom` avec l'adresse à chaque appel.
- Port : 16 bits (0 à 65535) ; 1 à 1023 réservé à root pour `bind`. `htons` : ordre des octets réseau.

![Dialogue TCP](img/socket-client-serveur-tcp.svg)

| | TCP (`SOCK_STREAM`) | UDP (`SOCK_DGRAM`) |
|---|---|---|
| Connexion, fiabilité | oui | non |
| Primitives | `read` / `write` | `sendto` / `recvfrom` |

**Patron serveur parallèle**
- `accept`, puis `fork` (ou thread) : le fils ferme la socket d'écoute et sert le client ; le père ferme la socket de service et retourne à `accept`. `signal(SIGCHLD, SIG_IGN)` évite les zombies.

| Piège | Bon réflexe |
|---|---|
| Confondre socket d'écoute et de service | `accept` renvoie une nouvelle socket pour chaque client |
| Mettre `listen` / `accept` dans un serveur UDP | UDP : `bind`, `recvfrom`, `sendto` |
| Serveur itératif lent avec N clients | `fork` ou thread après `accept` |
| Oublier `htons` sur le port | Toujours `htons(port)` : 1664 serait lu 32774 |
| « Socket = IP + port » | Aussi un descripteur de fichier et un protocole |
