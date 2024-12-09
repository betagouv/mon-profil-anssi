import express from "express";
import { ressourceProfil } from "./ressourceProfil.js";
import { ConfigurationServeur } from "./configurationServeur.js";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = express();
  app.use("/profil", ressourceProfil(configurationServeur));

  return app;
};

export { creeServeur };
