import { Request, Response, Router } from "express";
import * as z from "zod";
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

  const schemaLectureProfil = z.object({params: z.strictObject({email: z.email()})});

  routeur.get(
    "/:email",
    middleware.decodeJeton(),
    middleware.valideRequete(schemaLectureProfil),
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
      const profil = await entrepotProfil.parEmail((email as string).toLowerCase());
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

  const schemaCorpsPourMiseAJour = z.object({
    body: z.strictObject({
      email: z.email("L'adresse email à mettre à jour est invalide").optional(),
      nom: z.string('Le nom est invalide').max(1024).optional(),
      prenom: z.string('Le prénom est invalide').max(1024).optional(),
      organisation: z.any().superRefine((valeur, contexte) => {
        if (typeof valeur === 'object' && valeur !== null) {
          if (Object.keys(valeur).length === 0) return;

          if (valeur.nom === undefined || typeof valeur.nom !== 'string' || valeur.nom.length > 1024) {
            contexte.addIssue({ code: "custom", message: "Le nom de l'organisation est invalide" })
          }

          if (valeur.siret === undefined || typeof valeur.siret !== 'string' || !/^\d{14}/.test(valeur.siret)) {
            contexte.addIssue({ code: "custom", message: "Le siret de l'organisation est invalide" })
          }

          if (valeur.departement === undefined || typeof valeur.departement !== 'string' || valeur.departement.length in [2, 3]) {
            contexte.addIssue({ code: "custom", message: "Le département de l'organisation est invalide" })
          }

          return z.NEVER;
        }

        contexte.addIssue({ code: "custom", message: "L'organisation est invalide" })
        return z.NEVER;
      }).optional(),
      domainesSpecialite: z.array(z.string('Les domaines de spécialité sont invalides').max(42), 'Les domaines de spécialité sont invalides').max(100, 'Les domaines de spécialité sont invalides').optional(),
      telephone: z.string('Le numéro de téléphone est invalide').max(20, 'Le numéro de téléphone est invalide').optional(),
    }),
  });

  routeur.put(
    "/:email",
    middleware.decodeJeton(),
    middleware.valideRequete(z.object({params: z.strictObject({
      email: z.email("L'adresse email existante est invalide"),
    })})),
    middleware.valideRequete(schemaCorpsPourMiseAJour),
    async (requete: Request, reponse) => {
      // #swagger.tags = ['Profil']
      // #swagger.summary = "Crée ou mets à jour le profil avec les informations"
      // #swagger.description = "<ul><li><b>Si le profil existe</b>, il est mis à jour avec les informations fournies. Les données non fournies sont laissées intactes.</li><li><b>Si le profil n’existe pas</b>, les données sont toutes obligatoires, sauf le téléphone.</li></ul>"
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
      const { email: emailParametre } = requete.params;
      const email = emailParametre as string;
      const { nom, prenom, telephone, organisation, domainesSpecialite } =
        requete.body;
      let profil = await entrepotProfil.parEmail(email.toLowerCase());
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
