import express from "express";
import { ressourceProfil } from "./ressourceProfil";
import { ConfigurationServeur } from "./configurationServeur";
import redoc from "redoc-express";
import rateLimit from "express-rate-limit";
import { ressourceInscriptions } from "./ressourceInscriptions";

const creeServeur = (configurationServeur: ConfigurationServeur) => {
  const app = express();

  const vingtParSeconde = rateLimit({ windowMs: 1000, limit: 20 });
  app.use(vingtParSeconde);
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
