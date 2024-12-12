import { Router, Request, Response } from "express";
import { ConfigurationServeur } from "./configurationServeur";

const ressourceInscription = ({
  entrepotProfil,
  middleware,
}: ConfigurationServeur) => {
  const routeur = Router();

  routeur.post(
    "/",
    middleware.aseptise("email", "nom", "prenom"),
    async (requete: Request, reponse: Response) => {
      const { email, nom, prenom } = requete.body;
      await entrepotProfil.ajoute({ email, nom, prenom });
      reponse.sendStatus(201);
    },
  );

  return routeur;
};

export { ressourceInscription };
