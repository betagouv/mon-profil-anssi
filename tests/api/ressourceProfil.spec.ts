import { beforeEach, describe, it } from "node:test";
import * as assert from "assert";
import request from "supertest";
import { creeServeur } from "../../src/api/mpa";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { fabriqueMiddleware } from "../../src/api/middleware";

describe("Sur demande du profil", function () {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire();
    const jeanDujardin = {
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
      entite: {
        siret: "DINUM",
        departement: "33",
      },
      domainesSpecialite: ["RSSI", "JURI"],
      telephone: "0607080910",
    };
    entrepotProfil.ajoute(jeanDujardin);
    serveur = creeServeur({ entrepotProfil, middleware: fabriqueMiddleware() });
  });

  it("répond 200", async function () {
    const reponse = await request(serveur)
      .get("/profil?email=jean@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 200);
  });

  it("renvoie les données du profil", async () => {
    const reponse = await request(serveur)
      .get("/profil?email=jean@beta.fr")
      .set("Accept", "application/json");

    assert.deepEqual(reponse.body, {
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
      entite: {
        siret: "DINUM",
        departement: "33",
      },
      domainesSpecialite: ["RSSI", "JURI"],
      telephone: "0607080910",
    });
  });

  it("répond 404 lorsque le profil est inconnu", async () => {
    const reponse = await request(serveur)
      .get("/profil?email=inconnu@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 404);
  });

  it("répond 400 lorque l'email n'est pas fourni", async () => {
    const reponse = await request(serveur).get("/profil");

    assert.equal(reponse.status, 400);
  });

  it("aseptise les paramètres", async () => {
    const jeanInferieurDujardin = {
      email: "jean&lt;Dujardin",
      nom: "Jean Dujardin",
      prenom: "",
    };
    await entrepotProfil.ajoute(jeanInferieurDujardin);

    const reponse = await request(serveur).get("/profil?email=jean<Dujardin");

    assert.equal(reponse.status, 200);
    assert.equal(reponse.body.nom, "Jean Dujardin");
  });
});
