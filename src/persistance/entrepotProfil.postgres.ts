import { Profil } from "../metier/profil";
import knex, { Knex } from "knex";
import { EntrepotProfil } from "../metier/entrepotProfil";
import { knexConfig } from "./knexfile";
import { Inscription } from "../metier/inscription";
import { AdaptateurHachage } from "./adaptateurHachage";
import { AdaptateurChiffrement, ObjetChiffre } from "./adaptateurChiffrement";
import { ProfilDb } from "./profilDb";

type NodeEnv = "development" | "production";

const connexion = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv)
    throw new Error("Configuration invalide : NODE_ENV non renseigné.");
  return knex(knexConfig[nodeEnv as NodeEnv]);
};

export const entrepotProfilPostgres = ({
  adaptateurChiffrement,
  adaptateurHachage,
}: {
  adaptateurChiffrement: AdaptateurChiffrement;
  adaptateurHachage: AdaptateurHachage;
}): EntrepotProfil => {
  const hashEmail = (email: string) => {
    return adaptateurHachage.hacheSha256(email);
  };

  async function metsAJourInscriptions(
    db: Knex<any, unknown[]>,
    profil: Profil,
    emailHash: string,
  ) {
    const donnees = await adaptateurChiffrement.chiffre({
      email: profil.email,
    });
    await db("inscriptions").where("email_hash", emailHash).delete();
    await db("inscriptions").insert(
      profil.inscriptions.map((inscription) => ({
        donnees,
        email_hash: emailHash,
        service: inscription.service,
        date_inscription: inscription.date,
      })),
    );
  }

  return {
    async metsAJour(profil: Profil): Promise<void> {
      const db = connexion();
      const {
        email,
        prenom,
        nom,
        telephone,
        organisation,
        domainesSpecialite,
      } = profil;
      const emailHash = hashEmail(email);
      const donnees = await adaptateurChiffrement.chiffre({
        email,
        prenom,
        nom,
        telephone,
        organisation,
        domainesSpecialite,
      });
      await db("profils").where({ email_hash: emailHash }).update({
        email_hash: emailHash,
        donnees,
      });
      await metsAJourInscriptions(db, profil, emailHash);
    },

    async ajoute(profil: Profil): Promise<void> {
      const db = connexion();
      const {
        email,
        prenom,
        nom,
        telephone,
        domainesSpecialite,
        organisation,
      } = profil;
      const emailHash = hashEmail(email);
      const donnees = await adaptateurChiffrement.chiffre({
        email,
        prenom,
        nom,
        telephone,
        organisation,
        domainesSpecialite,
      });
      await db("profils").insert({
        email_hash: emailHash,
        donnees,
      });
      await metsAJourInscriptions(db, profil, emailHash);
    },

    async parEmail(email: string): Promise<Profil | undefined> {
      const db = connexion();
      const emailHash = hashEmail(email);
      const donneesProfilChiffrees = await db("profils")
        .where({ email_hash: emailHash })
        .first()
        .select();

      if (!donneesProfilChiffrees) return undefined;

      const donneesProfil = await adaptateurChiffrement.dechiffre<Profil>(
        donneesProfilChiffrees.donnees,
      );

      const profil = new Profil(donneesProfil);
      const donneesInscriptions = await db("inscriptions")
        .where("email_hash", emailHash)
        .select();
      profil.inscriptions = donneesInscriptions.map(
        (donnees) => new Inscription(donnees.service, donnees.date_inscription),
      );
      return profil;
    },
  };
};

export const fabriqueEntrepotProfilPostgres = ({
  adaptateurChiffrement,
  adaptateurHachage,
}: {
  adaptateurChiffrement: AdaptateurChiffrement;
  adaptateurHachage: AdaptateurHachage;
}) => entrepotProfilPostgres({ adaptateurChiffrement, adaptateurHachage });
