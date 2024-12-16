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
    async (requete, reponse) => {
      const { email } = requete.params;
      const { nom, prenom, telephone, organisation, domainesSpecialite } =
        requete.body;
      let profil = await entrepotProfil.parEmail(email);
      if (!profil) {
        reponse.sendStatus(404);
        return;
      }
      if (prenom) profil.prenom = prenom;
      if (nom) profil.nom = nom;
      if (telephone) profil.telephone = telephone;
      if (
        organisation &&
        organisation.nom &&
        organisation.siret &&
        organisation.departement
      ) {
        profil.organisation = organisation;
      }
      if (domainesSpecialite && domainesSpecialite.length !== 0) {
        profil.domainesSpecialite = domainesSpecialite;
      }
      await entrepotProfil.metsAJour(profil);
      reponse.sendStatus(200);
    },
  );

  return routeur;
};

export { ressourceProfil };
