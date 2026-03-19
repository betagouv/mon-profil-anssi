import express from "express";
import redoc from "redoc-express";
import { ConfigurationServeur } from "./configurationServeur";
import { ressourceInscriptions } from "./ressourceInscriptions";
import { ressourceProfil } from "./ressourceProfil";

import { creeServeurLab } from "@lab-anssi/lib";
import { ressourceRechercheProfils } from "./ressourceRechercheProfils";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = creeServeurLab(configurationServeur.serveurLab);

  app.use(express.json({ limit: "1mb" }));

  app.use("/profil", ressourceProfil(configurationServeur));
  app.use("/profils", ressourceRechercheProfils(configurationServeur));

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

