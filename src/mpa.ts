import express from "express";

const creeServeur = () => {
  const app = express();

  app.get("/profil", (requete, reponse) => {
    if (requete.query.email === "inconnu@beta.fr") {
      reponse.sendStatus(404);
      return;
    }
    reponse.send({
      nom: "Dujardin",
      prenom: "Jean",
      entite: {
        siret: "DINUM",
        departement: "33",
      },
      domainesSpecialite: ["RSSI", "JURI"],
      telephone: "0607080910",
    });
  });

  return app;
};

export { creeServeur };
