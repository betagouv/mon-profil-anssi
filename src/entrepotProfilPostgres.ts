import { Profil } from "./profil";
import knex from "knex";
import { EntrepotProfil } from "./entrepotProfil";

export const entrepotProfilPostgres: EntrepotProfil = {
  async parEmail(email: string): Promise<Profil | undefined> {
    const db = knex({
      client: "pg",
      connection: "postgres://postgres@mpa-db/mpa",
      pool: { min: 0, max: 10 },
      migrations: { tableName: "knex_migrations" },
    });
    return db("profils").where({ email }).first().select();
  },
};
