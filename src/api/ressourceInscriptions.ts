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

  routeur.post(
    "/",
    middleware.aseptise(
      "*.donneesProfil.email",
      "*.donneesProfil.nom",
      "*.donneesProfil.prenom",
      "*.donneesProfil.organisation.*",
      "*.donneesProfil.domainesSpecialite.*",
      "*.donneesProfil.telephone",
    ),
    middleware.decodeJeton(),
    async (requete, reponse) => {
      // #swagger.tags = ['Inscriptions']
      // #swagger.summary = "Inscris des utilisateurs à un service"
      // #swagger.description = "<ul><li><b>Si le profil existe</b>, il est simplement inscrit pour le nouveau service.</li><li><b>Si le profil n’existe pas</b>, il est créé.</li></ul>"
      /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Données et date d\'inscription des utilisateurs',
            schema: { $ref: '#/definitions/Inscriptions' }
          }
          #swagger.security = [{
              "Bearer token": []
            }]
      */
      const serviceClient = (requete as Request & { service: string }).service;
      let donnees: DemandeInscription[] = requete.body;
      if (donnees.length === 0) {
        // #swagger.responses[200] = { description: 'Aucun utilisateur à traiter' }
        reponse.sendStatus(200);
        return;
      }
      if (donnees.length > 500) {
        // #swagger.responses[413] = { description: 'Le nombre d\'utilisateurs à inscrire est trop important (500 max.)', schema: { $ref: '#/definitions/Erreur' } }
        reponse.status(413).send({
          erreur: "Le nombre d'inscriptions simultanées maximal est de 500.",
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
              erreur: e.message,
            });
          }
        }
      }
      if (erreurs.length > 0) {
        // #swagger.responses[400] = { description: 'Certaines données d\'utilisateur sont incomplètes', schema: { $ref: '#/definitions/ErreursInscriptions' } }
        reponse.status(400).send({ erreurs });
        return;
      }
      const promesses = donnees.map((demandeInscription) =>
        entrepotProfil
          .parEmail(demandeInscription.donneesProfil.email)
          .then((profil) => {
            const dateInscription = new Date(
              demandeInscription.dateInscription,
            );
            if (profil) {
              let lesDatesDInscriptionSontDifferentes =
                profil.dateDInscriptionA(serviceClient)?.getTime() !==
                dateInscription.getTime();
              if (lesDatesDInscriptionSontDifferentes) {
                profil.inscrisAuServiceALaDate(serviceClient, dateInscription);
                return entrepotProfil.metsAJour(profil);
              }
            } else {
              profil = new Profil(demandeInscription.donneesProfil);
              profil.inscrisAuServiceALaDate(serviceClient, dateInscription);
              return entrepotProfil.ajoute(profil);
            }
          }),
      );
      await Promise.all(promesses);
      // #swagger.responses[201] = { description: 'Tous les utilisateurs ont étés inscrits' }
      reponse.sendStatus(201);
    },
  );
  return routeur;
};

export { ressourceInscriptions };
