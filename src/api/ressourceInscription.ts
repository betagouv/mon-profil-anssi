import { Request, Response, Router } from "express";
import { ConfigurationServeur } from "./configurationServeur";
import { ErreurDonneesObligatoiresManquantes } from "../metier/erreurDonneesObligatoiresManquantes";
import { fabriqueServiceInscription } from "../metier/serviceInscription";

const ressourceInscription = ({
  entrepotProfil,
  middleware,
  adaptateurHorloge,
}: ConfigurationServeur) => {
  const routeur = Router();
  const serviceInscription = fabriqueServiceInscription({
    adaptateurHorloge,
    entrepotProfil,
  });

  routeur.post(
    "/",
    middleware.decodeJeton(),
    middleware.aseptise(
      "email",
      "nom",
      "prenom",
      "telephone",
      "domainesSpecialite.*",
      "organisation.*",
    ),
    async (requete: Request, reponse: Response) => {
      const {
        email,
        nom,
        prenom,
        telephone,
        domainesSpecialite,
        organisation,
      } = requete.body;
      const serviceClient = (requete as Request & { service: string }).service;

      let profil = await entrepotProfil.parEmail(email);
      if (profil && profil.estInscritA(serviceClient)) {
        reponse.sendStatus(200);
        return;
      }

      if (!profil) {
        try {
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
      } else {
        profil.inscrisAuService(serviceClient, adaptateurHorloge);
        profil.metsAJour({
          prenom,
          nom,
          telephone,
          domainesSpecialite,
          organisation,
        });
        await entrepotProfil.metsAJour(profil);
      }
      reponse.sendStatus(201);
    },
  );

  return routeur;
};

export { ressourceInscription };
