import type { Knex } from "knex";
import { fabriqueAdaptateurHachage } from "../src/persistance/adaptateurHachage";
import { adaptateurEnvironnement } from "../src/adaptateurEnvironnement";
import { Inscription } from "../src/metier/inscription";

type InscriptionAvecEmail = Inscription & { email: string };

export async function up(knex: Knex): Promise<void> {
  const adaptateurHachage = fabriqueAdaptateurHachage({
    adaptateurEnvironnement,
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.text("email_hash");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const inscriptions: InscriptionAvecEmail[] = await trx("inscriptions");

    const majInscriptions = inscriptions.map(({ email }) => {
      const emailHache = adaptateurHachage.hacheSha256(email);

      return trx("inscriptions").where({ email }).update({
        email_hash: emailHache,
      });
    });
    await Promise.all(majInscriptions);
  });

  await knex.schema.alterTable("inscriptions", (table) => {
    table.dropPrimary();
    table.primary(["email_hash", "service"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("inscriptions", (table) => {
    table.dropPrimary();
    table.primary(["email", "service"]);
    table.dropColumn("email_hash");
  });
}
