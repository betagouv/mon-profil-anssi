import knex from "knex";

export const knexConfig = {
  development: {
    client: "pg",
    connection: process.env.URL_SERVEUR_BASE_DONNEES,
    pool: { min: 0, max: 10 },
    migrations: { tableName: "knex_migrations" },
  },

  production: {
    client: "pg",
    connection: process.env.URL_SERVEUR_BASE_DONNEES,
    pool: { min: 0, max: 10 },
    migrations: { tableName: "knex_migrations" },
  },
};

type NodeEnv = "development" | "production";
const nodeEnv = process.env.NODE_ENV;
if (!nodeEnv)
  throw new Error("Configuration invalide : NODE_ENV non renseigné.");

export const db = knex(knexConfig[nodeEnv as NodeEnv]);
