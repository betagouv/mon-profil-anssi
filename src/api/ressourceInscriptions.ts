import { Request, Router } from "express";
import { DonneesCreationProfil, Profil } from "../metier/profil";
import { ConfigurationServeur } from "./configurationServeur";

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
    for (const demandeInscription of donnees) {
      let profil = await entrepotProfil.parEmail(
        demandeInscription.donneesProfil.email,
      );
      const dateInscription = new Date(demandeInscription.dateInscription);
      if (profil) {
        profil.inscrisAuServiceALaDate(serviceClient, dateInscription);
        await entrepotProfil.metsAJour(profil);
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
