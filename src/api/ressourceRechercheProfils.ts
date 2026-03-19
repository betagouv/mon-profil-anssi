import { Request, Response, Router } from "express";
import { ConfigurationServeur } from "./configurationServeur";

export const ressourceRechercheProfils = ({ entrepotProfil, middleware }: ConfigurationServeur) => {
    const routeur = Router();

    routeur.post(
        "/recherche",
        middleware.decodeJeton(),
        async (requete: Request, reponse: Response) => {
            // #swagger.tags = ['Recherche de profils']
            // #swagger.summary = "Recherche des profils"

            if (!requete.body || Object.keys(requete.body).length === 0) {
                return reponse.status(400).send("Le corps de la requête est manquant");
            }

            if (!Array.isArray(requete.body.emails)) {
                return reponse.status(400).send("Le champ 'emails' doit être un tableau d'emails");
            }

            const profils = await entrepotProfil.parEmails(requete.body.emails);

            reponse.send(profils);
        });

    return routeur;
};
