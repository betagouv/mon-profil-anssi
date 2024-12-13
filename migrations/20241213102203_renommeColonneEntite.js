exports.up = (knex) =>
  knex.schema.alterTable("profils", (table) => {
    table.renameColumn("entite", "organisation");
  });

exports.down = (knex) =>
  knex.schema.alterTable("profils", (table) => {
    table.renameColumn("organisation", "entite");
  });
