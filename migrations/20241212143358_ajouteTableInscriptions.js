exports.up = (knex) =>
  knex.schema.createTable("inscriptions", (table) => {
    table.text("email");
    table.text("service");
    table.dateTime("date_inscription");
    table.primary(["email", "service"]);
  });

exports.down = (knex) => knex.schema.dropTable("inscriptions");
