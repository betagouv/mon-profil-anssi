import express from "express";
import { EntrepotProfil } from "./entrepotProfil.js";

type ConfigurationServeur = {
  entrepotProfil: EntrepotProfil;
};

const creeServeur = ({ entrepotProfil }: ConfigurationServeur) => {
  const app = express();

  app.get("/profil", (requete, reponse) => {
    if (requete.query.email === "inconnu@beta.fr") {
      reponse.sendStatus(404);
      return;
    }
    const profil = entrepotProfil.parEmail("jean@beta.fr");
    reponse.send(profil);
  });

  return app;
};

export { creeServeur };
