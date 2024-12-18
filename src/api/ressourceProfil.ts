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
    middleware.decodeJeton(),
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

  routeur.put(
    "/:email",
    middleware.aseptise(
      "email",
      "nom",
      "prenom",
      "organisation.*",
      "domainesSpecialite.*",
      "telephone",
    ),
    middleware.decodeJeton(),
    async (requete, reponse) => {
      const { email } = requete.params;
      const { nom, prenom, telephone, organisation, domainesSpecialite } =
        requete.body;
      let profil = await entrepotProfil.parEmail(email);
      if (!profil) {
        reponse.sendStatus(404);
        return;
      }
      profil.metsAJour({
        nom,
        prenom,
        telephone,
        organisation,
        domainesSpecialite,
      });
      await entrepotProfil.metsAJour(profil);
      reponse.sendStatus(200);
    },
  );

  return routeur;
};

export { ressourceProfil };
