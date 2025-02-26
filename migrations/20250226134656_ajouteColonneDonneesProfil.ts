import type { Knex } from "knex";
import { adaptateurEnvironnement } from "../src/adaptateurEnvironnement";
import {
  fabriqueAdaptateurChiffrement,
  ObjetChiffre,
} from "../src/persistance/adaptateurChiffrement";
import { Profil } from "../src/metier/profil";
import { ProfilDb } from "../src/persistance/profilDb";

type ProfilAvecEmailHash = ProfilDb & { email_hash: string };

export async function up(knex: Knex): Promise<void> {
  const adaptateurChiffrement = fabriqueAdaptateurChiffrement({
    adaptateurEnvironnement,
  });

  await knex.schema.alterTable("profils", (table) => {
    table.jsonb("donnees");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const profils: ProfilAvecEmailHash[] = await trx("profils");

    const majProfils = profils.map(({ email_hash, ...autreDonnees }) => {
      const donneesRenommees = {
        email: autreDonnees.email,
        prenom: autreDonnees.prenom,
        nom: autreDonnees.nom,
        organisation: autreDonnees.organisation,
        domainesSpecialite: autreDonnees.domaines_specialite,
        telephone: autreDonnees.telephone,
      };
      adaptateurChiffrement
        .chiffre(donneesRenommees)
        .then((donneesChiffrees: ObjetChiffre) => {
          return trx("profils").where({ email_hash }).update({
            donnees: donneesChiffrees,
          });
        });
    });
    await Promise.all(majProfils);
  });

  await knex.schema.alterTable("profils", (table) => {
    table.dropColumns(
      "email",
      "prenom",
      "nom",
      "organisation",
      "domaines_specialite",
      "telephone",
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  const adaptateurChiffrement = fabriqueAdaptateurChiffrement({
    adaptateurEnvironnement,
  });

  await knex.schema.alterTable("profils", (table) => {
    table.text("email");
    table.text("prenom");
    table.text("nom");
    table.json("organisation");
    table.json("domaines_specialite");
    table.text("telephone");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const profilsChiffres: { email_hash: string; donnees: ObjetChiffre }[] =
      await trx("profils");

    const majProfils = profilsChiffres.map(({ email_hash, donnees }) => {
      adaptateurChiffrement
        .dechiffre<Profil>(donnees)
        .then((donneesEnClair) => {
          return trx("profils").where({ email_hash }).update({
            email: donneesEnClair.email,
            prenom: donneesEnClair.prenom,
            nom: donneesEnClair.nom,
            organisation: donneesEnClair.organisation,
            domaines_specialite: JSON.stringify(donneesEnClair.domainesSpecialite),
            telephone: donneesEnClair.telephone,
          });
        });
    });
    await Promise.all(majProfils);
  });

  await knex.schema.alterTable("profils", (table) => {
    table.dropColumn("donnees");
  });
}
