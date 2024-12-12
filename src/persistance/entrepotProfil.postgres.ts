import { Profil } from "../metier/profil";
import knex from "knex";
import { EntrepotProfil } from "../metier/entrepotProfil";
import { knexConfig } from "./knexfile";

type NodeEnv = "development" | "production";

const connexion = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv)
    throw new Error("Configuration invalide : NODE_ENV non renseigné.");
  return knex(knexConfig[nodeEnv as NodeEnv]);
};
export const entrepotProfilPostgres: EntrepotProfil = {
  async ajoute(profil: Profil): Promise<void> {
    const db = connexion();
    const { email, prenom, nom } = profil;
    await db("profils").insert({ email, prenom, nom });
  },
  async parEmail(email: string): Promise<Profil | undefined> {
    const db = connexion();
    return db("profils").where({ email }).first().select();
  },
};
