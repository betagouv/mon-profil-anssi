import express from "express";
import { ressourceProfil } from "./ressourceProfil";
import { ConfigurationServeur } from "./configurationServeur";
import { ressourceInscription } from "./ressourceInscription";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = express();

  app.use(express.json());

  app.use("/profil", ressourceProfil(configurationServeur));
  app.use("/inscription", ressourceInscription(configurationServeur));

  return app;
};

export { creeServeur };
