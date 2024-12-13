import { Profil } from "../metier/profil";
import knex from "knex";
import { EntrepotProfil } from "../metier/entrepotProfil";
import { knexConfig } from "./knexfile";
import { Inscription } from "../metier/inscription";

type NodeEnv = "development" | "production";

const connexion = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv)
    throw new Error("Configuration invalide : NODE_ENV non renseigné.");
  return knex(knexConfig[nodeEnv as NodeEnv]);
};
export const entrepotProfilPostgres: EntrepotProfil = {
  async metsAJour(profil: Profil): Promise<void> {
    const db = connexion();
    const { email, prenom, nom } = profil;
    await db("profils")
      .where("email", profil.email)
      .update({ email, prenom, nom });
    await db("inscriptions").where("email", profil.email).delete();
    await db("inscriptions").insert(
      profil.inscriptions.map((inscription) => ({
        email: profil.email,
        service: inscription.service,
        date_inscription: inscription.date,
      })),
    );
  },

  async ajoute(profil: Profil): Promise<void> {
    const db = connexion();
    const { email, prenom, nom } = profil;
    await db("profils").insert({ email, prenom, nom });
    await db("inscriptions").insert(
      profil.inscriptions.map((inscription) => ({
        email: profil.email,
        service: inscription.service,
        date_inscription: inscription.date,
      })),
    );
  },

  async parEmail(email: string): Promise<Profil | undefined> {
    const db = connexion();
    const donneesProfil = await db("profils").where({ email }).first().select();
    const profil = new Profil(donneesProfil);
    const donneesInscriptions = await db("inscriptions")
      .where("email", profil.email)
      .select();
    profil.inscriptions = donneesInscriptions.map(
      (donnees) => new Inscription(donnees.service, donnees.date_inscription),
    );
    return profil;
  },
};
