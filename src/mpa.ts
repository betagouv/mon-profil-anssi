import express from "express";
import { EntrepotProfil } from "./entrepotProfil.js";

type ConfigurationServeur = {
  entrepotProfil: EntrepotProfil;
};

const creeServeur = ({ entrepotProfil }: ConfigurationServeur) => {
  const app = express();

  app.get("/profil", (requete, reponse) => {
    if (!requete.query.email) {
      reponse.sendStatus(400);
      return;
    }
    const profil = entrepotProfil.parEmail(requete.query.email as string);
    if (!profil) {
      reponse.sendStatus(404);
      return;
    }

    reponse.send(profil);
  });

  return app;
};

export { creeServeur };
