import knex from "knex";
import { knexConfig } from "./knexfile";
import { EntrepotRevocationJeton } from "../api/entrepotRevocationJeton";
import { RevocationJeton } from "../api/revocationJeton";

type NodeEnv = "development" | "production";

const connexion = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv)
    throw new Error("Configuration invalide : NODE_ENV non renseigné.");
  return knex(knexConfig[nodeEnv as NodeEnv]);
};

export const entrepotRevocationJetonPostgres: EntrepotRevocationJeton = {
  async ajoute(revocationJeton: RevocationJeton) {
    let db = connexion();
    await db("revocations_jeton").insert({
      service: revocationJeton.service,
      date_fin_revocation: revocationJeton.dateFinRevocation,
    });
  },
  async pourService(service: string): Promise<RevocationJeton | undefined> {
    let db = connexion();
    let donnees = await db("revocations_jeton")
      .where({ service })
      .orderBy("date_fin_revocation", "desc")
      .first()
      .select();
    if (!donnees) {
      return undefined;
    }
    return {
      service: donnees.service,
      dateFinRevocation: donnees.date_fin_revocation,
    };
  },
};
