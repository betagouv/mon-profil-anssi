exports.up = (knex) =>
  knex.schema.createTable("revocations_jeton", (table) => {
    table.text("service");
    table.dateTime("date_fin_revocation");
    table.primary(["date_fin_revocation", "service"]);
  });

exports.down = (knex) => knex.schema.dropTable("revocations_jeton");
