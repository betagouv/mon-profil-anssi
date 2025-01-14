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
      // #swagger.tags = ['Profil']
      // #swagger.summary = "Récupère les informations d'un profil"
      /* #swagger.parameters['email'] = {
                in: 'query',
                description: 'Adresse e-mail de l\'utilisateur',
                required: true,
                type: 'string'
            }
          #swagger.security = [{
              "Bearer token": []
            }]
       */
      const { email } = requete.params;
      if (!email) {
        // #swagger.responses[400] = { description: 'L\'email n\'est pas présent dans la requête' }
        reponse.sendStatus(400);
        return;
      }
      const profil = await entrepotProfil.parEmail(email as string);
      if (!profil) {
        // #swagger.responses[404] = { description: 'L\'utilisateur est introuvable' }
        reponse.sendStatus(404);
        return;
      }

      /*
          #swagger.responses[200] = {
              description: 'Les informations de l\'utilisateur',
              schema: { $ref: '#/definitions/Profil' }
          }
      */
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
      // #swagger.tags = ['Profil']
      // #swagger.summary = "Crée ou mets à jour le profil avec les informations"
      /* #swagger.parameters['email'] = {
              in: 'query',
              description: 'Adresse e-mail de l\'utilisateur',
              required: true,
              type: 'string'
          }
          #swagger.parameters['body'] = {
            in: 'body',
            description: 'Données à mettre à jour',
            schema: { $ref: '#/definitions/Profil' }
          }
          #swagger.security = [{
              "Bearer token": []
            }]
      */
      const { email } = requete.params;
      const { nom, prenom, telephone, organisation, domainesSpecialite } =
        requete.body;
      let profil = await entrepotProfil.parEmail(email);
      const serviceClient = (requete as Request & { service: string }).service;

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
            // #swagger.responses[400] = { description: 'Les données de mise à jour ne sont pas complètes', schema: { $ref: '#/definitions/Erreur' } }
            reponse.status(400).send({ erreur: e.message });
            return;
          }
          throw e;
        }
        // #swagger.responses[201] = { description: 'L\'utilisateur a été créé' }
        reponse.sendStatus(201);
        return;
      }

      profil.inscrisAuService(serviceClient, adaptateurHorloge);
      profil.metsAJour({
        nom,
        prenom,
        telephone,
        organisation,
        domainesSpecialite,
      });

      await entrepotProfil.metsAJour(profil);
      // #swagger.responses[200] = { description: 'Les données ont été mises à jour' }
      reponse.sendStatus(200);
    },
  );

  return routeur;
};

export { ressourceProfil };
