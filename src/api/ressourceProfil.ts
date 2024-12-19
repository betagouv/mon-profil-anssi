import { Request, Response, Router } from "express";
import { ConfigurationServeur } from "./configurationServeur";
import { versProfilAPI } from "./profilAPI";
import { ErreurDonneesObligatoiresManquantes } from "../metier/erreurDonneesObligatoiresManquantes";
import { fabriqueServiceInscription } from "../metier/serviceInscription";

const ressourceProfil = ({
  entrepotProfil,
  middleware,
  adaptateurHorloge,
}: ConfigurationServeur) => {
  const routeur = Router();
  const serviceInscription = fabriqueServiceInscription({
    adaptateurHorloge,
    entrepotProfil,
  });

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
    async (requete: Request, reponse) => {
      const { email } = requete.params;
      const { nom, prenom, telephone, organisation, domainesSpecialite } =
        requete.body;
      let profil = await entrepotProfil.parEmail(email);
      if (!profil) {
        try {
          const serviceClient = (requete as Request & { service: string })
            .service;
          await serviceInscription.nouveauProfil(
            {
              email,
              nom,
              prenom,
              organisation,
              domainesSpecialite,
              telephone,
            },
            serviceClient,
          );
        } catch (e) {
          if (e instanceof ErreurDonneesObligatoiresManquantes) {
            reponse.status(400).send({ erreur: e.message });
            return;
          }
          throw e;
        }
        reponse.sendStatus(201);
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
