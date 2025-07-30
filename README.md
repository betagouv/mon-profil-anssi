# MonProfilANSSI

MonProfilANSSI est un service numérique développé par le laboratoire
d'innovation de l'[ANSSI](https://www.cyber.gouv.fr/), en lien avec l'incubateur
[BetaGouv](https://beta.gouv.fr/) de la direction interministérielle du
numérique. Il vise à fournir une API de profils pour les utilisateurs des services numériques de l’ANSSI.

## Configuration de l'environnement de développement

- [Git](https://git-scm.com/),
- [Docker](https://www.docker.com/)
- Une version récente de [Node.js](https://nodejs.org/en/) :\
  Nous vous conseillons d'utiliser [`nvm use`](https://github.com/nvm-sh/nvm), pour utiliser la même version que dans les environnements d'intégration continue et de production, car nous spécifions la version de Node.js à utiliser dans le fichier `.nvmrc`.

Commencer par récupérer les sources du projet et aller dans le répertoire créé.

```sh
$ git clone https://github.com/betagouv/mon-profil-anssi.git && cd mon-profil-anssi
```

Créer un `network` Docker pour accueillir MonProfilANSSI en local.

```sh
$ docker network create mpa-network
```

Créer un `network` Docker pour accueillir les services du Lab en local, s'il n'existe pas déjà.

```sh
$ docker network create lab-network
```

Créer un fichier `.env` à partir du fichier `.env.template` et renseigner les diverses variables d'environnement.

Démarrer le conteneur de la base de données.

```sh
$ docker compose up mpa-db
```

Se connecter au conteneur de la base de données et créer une nouvelle base `mpa` pour un utilisateur postgres.

```sh
$ docker compose exec mpa-db createdb -U postgres mpa
```

Le serveur est configuré et prêt à être redémarré.

## Lancement du serveur

Lancer le script `scripts/dev/start.sh`

Le serveur devrait être accessible depuis un navigateur à l'URL
`http://localhost:[PORT_MPA]` (avec comme valeur pour `PORT_MPA` celle indiquée
dans le fichier `.env`).

## Création d'une clé d'API client en local

Entrez dans un interpréteur node dans le conteneur applicatif :
```sh
$ docker compose exec api bash -c "node --import tsx"
```

Et exécutez les instructions suivantes :
```ts
const { ConsoleJetonJWT } = (await import("./src/admin/consoleJetonJWT.ts")).default;
ConsoleJetonJWT.forgeJeton("mss");
```

### Outils en local

- `Postgres` est relayé sur le port `5433` de l'hôte. Donc le requêtage via un outil graphique est possible.

## Accéder localement à l'instance docker pour éxecuter des commandes Node

```sh
$ docker exec -it mon-profil-anssi-api node
```
