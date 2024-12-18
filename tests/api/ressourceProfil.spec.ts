import { beforeEach, describe, it } from "node:test";
import * as assert from "assert";
import request from "supertest";
import { creeServeur } from "../../src/api/mpa";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { Profil } from "../../src/metier/profil";
import { adaptateurHorloge } from "../../src/metier/adaptateurHorloge";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";

describe("La ressource profil", () => {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire();
    const jeanDujardin = {
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
      organisation: {
        nom: "DINUM",
        siret: "12345678",
        departement: "33",
      },
      domainesSpecialite: ["RSSI", "JURI"],
      telephone: "0607080910",
    };
    entrepotProfil.ajoute(new Profil(jeanDujardin));
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware({
        adaptateurJWT: fauxAdaptateurJWT,
      }),
      adaptateurHorloge,
    });
  });

  describe("Sur demande du profil", () => {
    const requeteGETAuthentifiee = (url: string) =>
      request(serveur)
        .get(url)
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json");

    it("répond 200", async () => {
      const reponse = await requeteGETAuthentifiee("/profil/jean@beta.fr");

      assert.equal(reponse.status, 200);
    });

    it("renvoie les données du profil", async () => {
      const reponse = await requeteGETAuthentifiee("/profil/jean@beta.fr");

      assert.deepEqual(reponse.body, {
        email: "jean@beta.fr",
        nom: "Dujardin",
        prenom: "Jean",
        organisation: {
          nom: "DINUM",
          siret: "12345678",
          departement: "33",
        },
        domainesSpecialite: ["RSSI", "JURI"],
        telephone: "0607080910",
      });
    });

    it("répond 404 lorsque le profil est inconnu", async () => {
      const reponse = await requeteGETAuthentifiee("/profil/inconnu@beta.fr");

      assert.equal(reponse.status, 404);
    });

    it("aseptise les paramètres", async () => {
      const jeanInferieurDujardin = {
        email: "jean&lt;Dujardin",
        nom: "Jean Dujardin",
        prenom: " d",
        organisation: { nom: "DINUM", siret: "12345678", departement: "33" },
        domainesSpecialite: ["RSSI"],
      };
      await entrepotProfil.ajoute(new Profil(jeanInferieurDujardin));

      const reponse = await requeteGETAuthentifiee("/profil/jean<Dujardin");

      assert.equal(reponse.status, 200);
      assert.equal(reponse.body.nom, "Jean Dujardin");
    });

    it("renvoie une erreur 401 si le jeton est invalide", async () => {
      const reponse = await request(serveur)
        .get("/profil/jean@beta.fr")
        .set("Accept", "application/json");

      assert.equal(reponse.status, 401);
    });
  });

  describe("Sur demande de mise à jour du profil", () => {
    const requetePUTAuthentifiee = (url: string) =>
      request(serveur)
        .put(url)
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json");

    it("répond 200", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/jean@beta.fr");

      assert.equal(reponse.status, 200);
    });

    it("mets à jour le profil connu", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/jean@beta.fr").send({
        nom: "Dujardin2",
        prenom: "Jean2",
        organisation: {
          nom: "DINUM2",
          siret: "123456782",
          departement: "332",
        },
        domainesSpecialite: ["RSSI2", "JURI2"],
        telephone: "06070809102",
      });

      assert.equal(reponse.status, 200);
      let profilAJour = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profilAJour!.nom, "Dujardin2");
      assert.equal(profilAJour!.prenom, "Jean2");
      assert.equal(profilAJour!.organisation.nom, "DINUM2");
      assert.equal(profilAJour!.organisation.siret, "123456782");
      assert.equal(profilAJour!.organisation.departement, "332");
      assert.deepEqual(profilAJour!.domainesSpecialite, ["RSSI2", "JURI2"]);
      assert.equal(profilAJour!.telephone, "06070809102");
    });

    it("répond 404 si le profil est inconnu", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/inconnu@beta.fr");

      assert.equal(reponse.status, 404);
    });

    it("aseptise les paramètres", async () => {
      const jeanSup = {
        email: "&gt;jean@beta.fr",
        nom: "Dujardin",
        prenom: "Jean",
        organisation: {
          nom: "DINUM",
          siret: "12345678",
          departement: "33",
        },
        domainesSpecialite: ["RSSI", "JURI"],
        telephone: "0607080910",
      };
      await entrepotProfil.ajoute(new Profil(jeanSup));

      const reponse = await requetePUTAuthentifiee("/profil/>jean@beta.fr")
        .send({
          nom: "Dujardin>",
          prenom: "Jean>",
          organisation: {
            nom: "DINUM>",
            siret: "12345678>",
            departement: "33>",
          },
          domainesSpecialite: ["RSSI>", "JURI>"],
          telephone: "0607080910>",
        });

      assert.equal(reponse.status, 200);
      let profilAJour = await entrepotProfil.parEmail("&gt;jean@beta.fr");
      assert.equal(profilAJour!.nom, "Dujardin&gt;");
      assert.equal(profilAJour!.prenom, "Jean&gt;");
      assert.equal(profilAJour!.organisation.nom, "DINUM&gt;");
      assert.equal(profilAJour!.organisation.siret, "12345678&gt;");
      assert.equal(profilAJour!.organisation.departement, "33&gt;");
      assert.deepEqual(profilAJour!.domainesSpecialite, [
        "RSSI&gt;",
        "JURI&gt;",
      ]);
      assert.equal(profilAJour!.telephone, "0607080910&gt;");
    });

    it("ignore les informations vides", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/jean@beta.fr").send({
        organisation: {},
        nom: "",
        domainesSpecialite: [],
        prenom: "",
        telephone: "",
      });

      assert.equal(reponse.status, 200);
      let profilAJour = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profilAJour!.nom, "Dujardin");
      assert.equal(profilAJour!.prenom, "Jean");
      assert.equal(profilAJour!.organisation.nom, "DINUM");
      assert.equal(profilAJour!.organisation.siret, "12345678");
      assert.equal(profilAJour!.organisation.departement, "33");
      assert.deepEqual(profilAJour!.domainesSpecialite, ["RSSI", "JURI"]);
      assert.equal(profilAJour!.telephone, "0607080910");
    });

    it("renvoie une erreur 401 si le jeton est invalide", async () => {
      const reponse = await request(serveur)
        .put("/profil/jean@beta.fr")
        .set("Accept", "application/json");

      assert.equal(reponse.status, 401);
    });
  });
});
