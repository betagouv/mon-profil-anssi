import {Router, Request, Response} from "express";
import {ConfigurationServeur} from "./configurationServeur";

const ressourceInscription = ({entrepotProfil, middleware,}: ConfigurationServeur) => {
    const routeur = Router();

    routeur.post("/", async (requete: Request, reponse: Response) => {
        await entrepotProfil.ajoute(requete.body);
        reponse.sendStatus(201);
    });

    return routeur;
};

export {ressourceInscription};
