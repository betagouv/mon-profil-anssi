import express from "express";
import { ConfigurationServeur } from "./configurationServeur.js";

const ressourceProfil = ({ entrepotProfil }: ConfigurationServeur) => {
  const routeur = express.Router();

  routeur.get("/", (requete, reponse) => {
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

  return routeur;
};

export { ressourceProfil };
