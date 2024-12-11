import express from "express";
import { ConfigurationServeur } from "./configurationServeur";

const ressourceProfil = ({
  entrepotProfil,
  middleware,
}: ConfigurationServeur) => {
  const routeur = express.Router();

  routeur.get("/", middleware.aseptise("email"), async (requete, reponse) => {
    if (!requete.query.email) {
      reponse.sendStatus(400);
      return;
    }
    const profil = await entrepotProfil.parEmail(requete.query.email as string);
    if (!profil) {
      reponse.sendStatus(404);
      return;
    }

    reponse.send(profil);
  });

  return routeur;
};

export { ressourceProfil };
