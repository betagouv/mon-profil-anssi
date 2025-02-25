import type { Knex } from "knex";
import { fabriqueAdaptateurHachage } from "../src/persistance/adaptateurHachage";
import { adaptateurEnvironnement } from "../src/adaptateurEnvironnement";
import { Profil } from "../src/metier/profil";

export async function up(knex: Knex): Promise<void> {
  const adaptateurHachage = fabriqueAdaptateurHachage({
    adaptateurEnvironnement,
  });
  await knex.schema.alterTable("profils", (table) => {
    table.text("email_hash");
  });

  await knex.transaction(async (trx: Knex.Transaction) => {
    const profils: Profil[] = await trx("profils");

    const majProfils = profils.map(({ email }) => {
      const emailHache = adaptateurHachage.hacheSha256(email);

      return trx("profils").where({ email }).update({
        email_hash: emailHache,
      });
    });
    await Promise.all(majProfils);
  });

  await knex.schema.alterTable("profils", (table) => {
    table.dropPrimary();
    table.primary(["email_hash"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profils", (table) => {
    table.dropPrimary();
    table.primary(["email"]);
    table.dropColumn("email_hash");
  });
}
