import { Request, Response, Router } from "express";
import { ConfigurationServeur } from "./configurationServeur";
import { versProfilAPI } from "./profilAPI";

const ressourceProfil = ({
  entrepotProfil,
  middleware,
}: ConfigurationServeur) => {
  const routeur = Router();

  routeur.get(
    "/:email",
    middleware.aseptise("email"),
    async (requete: Request, reponse: Response) => {
      const { email } = requete.params;
      if (!email) {
        reponse.sendStatus(400);
        return;
      }
      const profil = await entrepotProfil.parEmail(email as string);
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
