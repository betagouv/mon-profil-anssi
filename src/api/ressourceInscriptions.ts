import { Request, Router } from "express";
import { DonneesCreationProfil, Profil } from "../metier/profil";
import { ConfigurationServeur } from "./configurationServeur";
import { ErreurDonneesObligatoiresManquantes } from "../metier/erreurDonneesObligatoiresManquantes";

type DemandeInscription = {
  dateInscription: string;
  donneesProfil: DonneesCreationProfil;
};

const ressourceInscriptions = ({
  entrepotProfil,
  middleware,
}: ConfigurationServeur) => {
  const routeur = Router();

  routeur.post("/", middleware.decodeJeton(), async (requete, reponse) => {
    const serviceClient = (requete as Request & { service: string }).service;
    let donnees: DemandeInscription[] = requete.body;
    if (donnees.length === 0) {
      reponse.sendStatus(200);
      return;
    }
    if (donnees.length > 500) {
      reponse.status(413).send({
        message: "Le nombre d'inscriptions simultanées maximal est de 500.",
      });
      return;
    }
    const erreurs = [];
    for (const demandeInscription of donnees) {
      try {
        new Profil(demandeInscription.donneesProfil);
        const dateInscription = new Date(demandeInscription.dateInscription);
        if (dateInscription.toString() === "Invalid Date") {
          throw new ErreurDonneesObligatoiresManquantes("dateInscription");
        }
      } catch (e) {
        if (e instanceof ErreurDonneesObligatoiresManquantes) {
          erreurs.push({
            email: demandeInscription.donneesProfil.email,
            description: e.message,
          });
        }
      }
    }
    if (erreurs.length > 0) {
      reponse.status(400).send({ erreurs });
      return;
    }
    for (const demandeInscription of donnees) {
      let profil = await entrepotProfil.parEmail(
        demandeInscription.donneesProfil.email,
      );
      const dateInscription = new Date(demandeInscription.dateInscription);
      if (profil) {
        if (
          profil.dateDInscriptionA(serviceClient)?.getTime() !==
          dateInscription.getTime()
        ) {
          profil.inscrisAuServiceALaDate(serviceClient, dateInscription);
          await entrepotProfil.metsAJour(profil);
        }
      } else {
        profil = new Profil(demandeInscription.donneesProfil);
        profil.inscrisAuServiceALaDate(serviceClient, dateInscription);
        await entrepotProfil.ajoute(profil);
      }
    }
    reponse.sendStatus(201);
  });
  return routeur;
};

export { ressourceInscriptions };
