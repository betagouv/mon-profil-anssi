# MonProfilANSSI

MonProfilANSSI est un service numérique développé par le laboratoire
d'innovation de l'[ANSSI](https://www.cyber.gouv.fr/), en lien avec l'incubateur
[BetaGouv](https://beta.gouv.fr/) de la direction interministérielle du
numérique. Il vise à fournir une API de profils pour les utilisateurs des services numériques de l’ANSSI.

## Configuration de l'environnement de développement

Il est nécessaire en prérequis d'avoir installé [Git](https://git-scm.com/),
[Docker](https://www.docker.com/) et [Node.js v23](https://nodejs.org/en/).

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

Lancer le script `scripts/start.sh`

Se connecter au conteneur de la base de données et créer une nouvelle base `mpa` pour un utilisateur postgres.

```sh
$ docker compose exec mpa-db createdb -U postgres mpa
```

Exécuter les migrations depuis le conteneur du serveur web.

```sh
$ docker compose exec api npx knex migrate:latest
```

Le serveur est configuré et prêt à être redémarré.

## Lancement du serveur

```sh
$ docker-compose restart api
```

(Ou arret et ré-exécution de `./script/start.sh`)

Le serveur devrait être accessible depuis un navigateur à l'URL
`http://localhost:[PORT_MPA]` (avec comme valeur pour `PORT_MPA` celle indiquée
dans le fichier `.env`).

### Outils en local

- `Postgres` est relayé sur le port `5433` de l'hôte. Donc le requêtage via un outil graphique est possible.
