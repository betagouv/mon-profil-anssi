import { Router, Request, Response } from "express";
import { ConfigurationServeur } from "./configurationServeur";
import { versProfilAPI } from "./profilAPI";

const ressourceProfil = ({
  entrepotProfil,
  middleware,
}: ConfigurationServeur) => {
  const routeur = Router();

  routeur.get(
    "/",
    middleware.aseptise("email"),
    async (requete: Request, reponse: Response) => {
      if (!requete.query.email) {
        reponse.sendStatus(400);
        return;
      }
      const profil = await entrepotProfil.parEmail(
        requete.query.email as string,
      );
      if (!profil) {
        reponse.sendStatus(404);
        return;
      }

      reponse.send(versProfilAPI(profil));
    },
  );

  return routeur;
};

export { ressourceProfil };
