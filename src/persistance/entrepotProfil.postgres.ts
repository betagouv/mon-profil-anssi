import { Profil } from "../metier/profil";
import knex, { Knex } from "knex";
import { EntrepotProfil } from "../metier/entrepotProfil";
import { knexConfig } from "./knexfile";
import { Inscription } from "../metier/inscription";
import { AdaptateurHachage } from "./adaptateurHachage";

type NodeEnv = "development" | "production";

const connexion = () => {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv)
    throw new Error("Configuration invalide : NODE_ENV non renseigné.");
  return knex(knexConfig[nodeEnv as NodeEnv]);
};

async function metsAJourInscriptions(db: Knex<any, unknown[]>, profil: Profil) {
  await db("inscriptions").where("email", profil.email).delete();
  await db("inscriptions").insert(
    profil.inscriptions.map((inscription) => ({
      email: profil.email,
      service: inscription.service,
      date_inscription: inscription.date,
    })),
  );
}

export const entrepotProfilPostgres = ({
  adaptateurHachage,
}: {
  adaptateurHachage: AdaptateurHachage;
}): EntrepotProfil => {
  const hashEmail = (email: string) => {
    return adaptateurHachage.hacheSha256(email);
  };

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
      await db("profils")
        .where({ email_hash: emailHash })
        .update({
          email,
          prenom,
          nom,
          telephone,
          organisation,
          domaines_specialite: JSON.stringify(domainesSpecialite),
          email_hash: emailHash,
        });
      await metsAJourInscriptions(db, profil);
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
      await db("profils").insert({
        email,
        prenom,
        nom,
        telephone,
        organisation,
        domaines_specialite: JSON.stringify(domainesSpecialite),
        email_hash: emailHash,
      });
      await metsAJourInscriptions(db, profil);
    },

    async parEmail(email: string): Promise<Profil | undefined> {
      const db = connexion();
      const emailHash = hashEmail(email);
      const donneesProfil = await db("profils")
        .where({ email_hash: emailHash })
        .first()
        .select();

      if (!donneesProfil) return undefined;

      delete donneesProfil.email_hash;

      const { domaines_specialite: domainesSpecialite, ...autresDonnees } =
        donneesProfil;
      const profil = new Profil({ domainesSpecialite, ...autresDonnees });
      const donneesInscriptions = await db("inscriptions")
        .where("email", profil.email)
        .select();
      profil.inscriptions = donneesInscriptions.map(
        (donnees) => new Inscription(donnees.service, donnees.date_inscription),
      );
      return profil;
    },
  };
};

export const fabriqueEntrepotProfilPostgres = ({
  adaptateurHachage,
}: {
  adaptateurHachage: AdaptateurHachage;
}) => entrepotProfilPostgres({ adaptateurHachage });
