exports.up = (knex) =>
  knex.schema.createTable("profils", (table) => {
    table.text("email");
    table.text("prenom");
    table.text("nom");
    table.json("entite");
    table.json("domaines_specialite");
    table.text("telephone");
    table.primary(["email"]);
  });

exports.down = (knex) => knex.schema.dropTable("profils");
