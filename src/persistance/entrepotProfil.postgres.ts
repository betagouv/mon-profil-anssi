import { Profil } from "../metier/profil";
import { EntrepotProfil } from "../metier/entrepotProfil";
import { db } from "./knexfile";
import { Inscription } from "../metier/inscription";
import { AdaptateurHachage } from "./adaptateurHachage";
import { AdaptateurChiffrement } from "./adaptateurChiffrement";

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

  async function metsAJourInscriptions(profil: Profil, emailHash: string) {
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
      await metsAJourInscriptions(profil, emailHash);
    },

    async ajoute(profil: Profil): Promise<void> {
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
      await metsAJourInscriptions(profil, emailHash);
    },

    async parEmail(email: string): Promise<Profil | undefined> {
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
