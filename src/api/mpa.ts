import express from "express";
import { ressourceProfil } from "./ressourceProfil";
import { ConfigurationServeur } from "./configurationServeur";
import redoc from "redoc-express";
import { ressourceInscriptions } from "./ressourceInscriptions";

import { creeServeurLab } from "@lab-anssi/lib";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = creeServeurLab(configurationServeur.serveurLab);

  app.use(express.json({ limit: "1mb" }));

  app.use("/profil", ressourceProfil(configurationServeur));

  app.use("/inscriptions", ressourceInscriptions(configurationServeur));

  app.get("/docs/swagger.json", (req, res) => {
    // #swagger.ignore = true
    res.sendFile("public/swagger.json", { root: "dist" });
  });

  app.get(
    "/docs",
    // #swagger.ignore = true
    redoc({
      title: "Documentation API de MonProfilANSSI",
      specUrl: "/docs/swagger.json",
    }),
  );

  return app;
};

export { creeServeur };
