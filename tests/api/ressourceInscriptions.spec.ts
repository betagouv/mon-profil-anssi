import { beforeEach, describe, it } from "node:test";
import { Express } from "express";
import request from "supertest";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { creeServeur } from "../../src/api/mpa";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";
import { fauxServiceRevocationJeton } from "./fauxServiceRevocationJeton";
import assert from "assert";

describe("La ressource profil", () => {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;
  const donneesProfilJeanDujardin = {
    email: "jean@beta.fr",
    nom: "Dujardin",
    prenom: "Jean",
    organisation: {
      nom: "DINUM",
      siret: "12345678",
      departement: "33",
    },
    domainesSpecialite: ["RSSI"],
    telephone: "0607080910",
  };

  const donneesProfilMarieDupont = {
    email: "marie@beta.fr",
    nom: "Dupont",
    prenom: "Marie",
    organisation: {
      nom: "DINUM",
      siret: "12345678",
      departement: "33",
    },
    domainesSpecialite: ["RSSI"],
    telephone: "0607080910",
  };

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire({
      adaptateurHachage: { hacheSha256: (chaine) => chaine },
    });
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware({
        adaptateurJWT: fauxAdaptateurJWT,
        serviceRevocationJeton: fauxServiceRevocationJeton,
      }),
      adaptateurHorloge: { maintenant: () => new Date("2024-12-17") },
    });
  });

  describe("Sur requête POST", () => {
    it("renvoie 200 s'il n'y a rien à faire", async () => {
      const reponse = await request(serveur)
        .post("/inscriptions")
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json")
        .send([]);

      assert.equal(reponse.status, 200);
    });

    it("ajoute le profil s'il n'existait pas déjà", async () => {
      const reponse = await request(serveur)
        .post("/inscriptions")
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json")
        .send([
          {
            dateInscription: new Date("2020-10-25"),
            donneesProfil: donneesProfilJeanDujardin,
          },
        ]);

      assert.equal(reponse.status, 201);
      let jean = await entrepotProfil.parEmail("jean@beta.fr");
      assert.notEqual(jean, undefined);
      assert.equal(jean?.nom, "Dujardin");
    });

    it("inscris le profil à la date spécifiée", async () => {
      await request(serveur)
        .post("/inscriptions")
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json")
        .send([
          {
            dateInscription: new Date("2020-10-25"),
            donneesProfil: donneesProfilJeanDujardin,
          },
        ]);

      let jean = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(jean!.estInscritA("mss"), true);
      assert.deepEqual(jean!.dateDInscriptionA("mss"), new Date("2020-10-25"));
    });

    it("inscris plusieurs profils en même temps", async () => {
      await request(serveur)
        .post("/inscriptions")
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json")
        .send([
          {
            dateInscription: new Date("2020-10-25"),
            donneesProfil: donneesProfilJeanDujardin,
          },
          {
            dateInscription: new Date("2020-12-13"),
            donneesProfil: donneesProfilMarieDupont,
          },
        ]);

      let marie = await entrepotProfil.parEmail("marie@beta.fr");
      assert.notEqual(marie, undefined);
      assert.equal(marie!.estInscritA("mss"), true);
      assert.deepEqual(marie!.dateDInscriptionA("mss"), new Date("2020-12-13"));
    });
  });
});
