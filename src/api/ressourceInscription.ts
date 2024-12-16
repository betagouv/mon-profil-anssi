import { Router, Request, Response } from "express";
import { ConfigurationServeur } from "./configurationServeur";
import { Profil } from "../metier/profil";
import { ErreurDonneesObligatoiresManquantes } from "../metier/erreurDonneesObligatoiresManquantes";

const ressourceInscription = ({
  entrepotProfil,
  middleware,
  adaptateurHorloge,
}: ConfigurationServeur) => {
  const routeur = Router();

  routeur.post(
    "/",
    middleware.aseptise(
      "email",
      "nom",
      "prenom",
      "telephone",
      "domainesSpecialite",
      "organisation.*",
      "x-id-client",
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
      const serviceClient = requete.header("x-id-client") as string;

      let profil = await entrepotProfil.parEmail(email);
      if (profil && profil.estInscritA(serviceClient)) {
        reponse.sendStatus(200);
        return;
      }

      if (!profil) {
        try {
          profil = new Profil({
            email,
            nom,
            prenom,
            organisation,
            domainesSpecialite,
            telephone,
          });
        } catch (e) {
          if (e instanceof ErreurDonneesObligatoiresManquantes) {
            reponse.status(400).send({ erreur: e.message });
            return;
          }
          throw e;
        }
        profil.inscrisAuService(serviceClient, adaptateurHorloge);
        await entrepotProfil.ajoute(profil);
      } else {
        profil.inscrisAuService(serviceClient, adaptateurHorloge);

        try {
          profil.metsAJour({
            prenom,
            nom,
            telephone,
            domainesSpecialite,
            organisation,
          });
        } catch (e) {
          if (e instanceof ErreurDonneesObligatoiresManquantes) {
            reponse.status(400).send({ erreur: e.message });
            return;
          }
          throw e;
        }
        await entrepotProfil.metsAJour(profil);
      }
      reponse.sendStatus(201);
    },
  );

  return routeur;
};

export { ressourceInscription };
