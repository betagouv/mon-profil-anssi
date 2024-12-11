import { Profil } from "./profil";
import knex from "knex";
import { EntrepotProfil } from "./entrepotProfil";
import { knexConfig } from "./knexfile";

type NodeEnv = "development" | "production";

export const entrepotProfilPostgres: EntrepotProfil = {
  async parEmail(email: string): Promise<Profil | undefined> {
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) return;
    const db = knex(knexConfig[nodeEnv as NodeEnv]);
    return db("profils").where({ email }).first().select();
  },
};
