import { beforeEach, describe, it } from "node:test";
import { Express } from "express";
import request, { Test } from "supertest";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { creeServeur } from "../../src/api/mpa";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";
import { fauxServiceRevocationJeton } from "./fauxServiceRevocationJeton";
import assert from "assert";
import {
  fabriqueServiceInscription,
  ServiceInscription,
} from "../../src/metier/serviceInscription";
import { AdaptateurHorloge } from "../../src/metier/adaptateurHorloge";

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
  let postDepuisMss: Test;
  let adaptateurHorloge: AdaptateurHorloge;
  let serviceInscription: ServiceInscription;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire({
      adaptateurHachage: { hacheSha256: (chaine) => chaine },
    });
    adaptateurHorloge = { maintenant: () => new Date("2024-12-17") };
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware({
        adaptateurJWT: fauxAdaptateurJWT,
        serviceRevocationJeton: fauxServiceRevocationJeton,
      }),
      adaptateurHorloge,
    });
    postDepuisMss = request(serveur)
      .post("/inscriptions")
      .auth("mss-JWT", { type: "bearer" })
      .set("Accept", "application/json");
    serviceInscription = fabriqueServiceInscription({
      adaptateurHorloge,
      entrepotProfil,
    });
  });

  describe("Sur requête POST", () => {
    it("renvoie 200 s'il n'y a rien à faire", async () => {
      const reponse = await postDepuisMss.send([]);

      assert.equal(reponse.status, 200);
    });

    it("limite le nombre d'inscriptions simultanées à 500", async () => {
      const inscription = {
        dateInscription: new Date("2020-10-25"),
        donneesProfil: donneesProfilJeanDujardin,
      };

      const reponse = await postDepuisMss.send(Array(501).fill(inscription));

      assert.equal(reponse.status, 413); // request entity too large
      assert.equal(
        reponse.body.message,
        "Le nombre d'inscriptions simultanées maximal est de 500.",
      );
    });

    describe("lorsque le profil est inconnu", () => {
      it("ajoute le profil", async () => {
        const reponse = await postDepuisMss.send([
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
        await postDepuisMss.send([
          {
            dateInscription: new Date("2020-10-25"),
            donneesProfil: donneesProfilJeanDujardin,
          },
        ]);

        let jean = await entrepotProfil.parEmail("jean@beta.fr");
        assert.equal(jean!.estInscritA("mss"), true);
        assert.deepEqual(
          jean!.dateDInscriptionA("mss"),
          new Date("2020-10-25"),
        );
      });

      it("inscris plusieurs profils en même temps", async () => {
        await postDepuisMss.send([
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
        assert.deepEqual(
          marie!.dateDInscriptionA("mss"),
          new Date("2020-12-13"),
        );
      });
    });

    describe("lorsque le profil est connu", () => {
      describe("et qu'il n'est pas déjà inscrit", () => {
        beforeEach(async () => {
          await serviceInscription.nouveauProfil(
            donneesProfilJeanDujardin,
            "mac",
          );
        });

        it("n'ajoute pas de doublon", async () => {
          await postDepuisMss.send([
            {
              dateInscription: new Date("2020-10-25"),
              donneesProfil: donneesProfilJeanDujardin,
            },
          ]);

          assert.equal(entrepotProfil.nombre(), 1);
        });

        it("l'inscrit au service", async () => {
          await postDepuisMss.send([
            {
              dateInscription: new Date("2020-10-25"),
              donneesProfil: donneesProfilJeanDujardin,
            },
          ]);

          const jean = await entrepotProfil.parEmail("jean@beta.fr");
          assert.equal(jean?.estInscritA("mss"), true);
          assert.deepEqual(
            jean?.dateDInscriptionA("mss"),
            new Date("2020-10-25"),
          );
        });
      });
      describe("et qu'il est déjà inscrit", () => {
        beforeEach(async () => {
          await serviceInscription.nouveauProfil(
            donneesProfilJeanDujardin,
            "mss",
          );
        });

        it("mets à jour la date d'inscription", async () => {
          await postDepuisMss.send([
            {
              dateInscription: new Date("2020-10-25"),
              donneesProfil: donneesProfilJeanDujardin,
            },
          ]);

          const jean = await entrepotProfil.parEmail("jean@beta.fr");
          assert.equal(jean?.estInscritA("mss"), true);
          assert.deepEqual(
            jean?.dateDInscriptionA("mss"),
            new Date("2020-10-25"),
          );
        });
      });
    });
  });
});
