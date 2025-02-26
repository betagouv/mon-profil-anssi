import type { Knex } from "knex";
import { adaptateurEnvironnement } from "../src/adaptateurEnvironnement";
import {
  fabriqueAdaptateurChiffrement,
  ObjetChiffre,
} from "../src/persistance/adaptateurChiffrement";
import { Inscription } from "../src/metier/inscription";

type InscriptionAvecEmailHash = Inscription & {
  email_hash: string;
  email: string;
};

export async function up(knex: Knex): Promise<void> {
  const adaptateurChiffrement = fabriqueAdaptateurChiffrement({
    adaptateurEnvironnement,
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.jsonb("donnees");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const inscriptions: InscriptionAvecEmailHash[] = await trx("inscriptions");

    const majInscriptions = inscriptions.map(({ email, email_hash }) => {
      adaptateurChiffrement
        .chiffre({ email })
        .then((donneesChiffrees: ObjetChiffre) => {
          return trx("inscriptions").where({ email_hash }).update({
            donnees: donneesChiffrees,
          });
        });
    });
    await Promise.all(majInscriptions);
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.dropColumns("email");
  });
}

export async function down(knex: Knex): Promise<void> {
  const adaptateurChiffrement = fabriqueAdaptateurChiffrement({
    adaptateurEnvironnement,
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.text("email");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const inscriptionsChiffrees: {
      email_hash: string;
      donnees: ObjetChiffre;
    }[] = await trx("inscriptions");

    const majInscriptions = inscriptionsChiffrees.map(
      ({ email_hash, donnees }) => {
        adaptateurChiffrement
          .dechiffre<{ email: string }>(donnees)
          .then((donneesEnClair) => {
            return trx("inscriptions").where({ email_hash }).update({
              email: donneesEnClair.email,
            });
          });
      },
    );
    await Promise.all(majInscriptions);
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.dropColumn("donnees");
  });
}
