import express from "express";
import { ressourceProfil } from "./ressourceProfil";
import { ConfigurationServeur } from "./configurationServeur";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = express();

  app.use(express.json());

  app.use("/profil", ressourceProfil(configurationServeur));

  return app;
};

export { creeServeur };
