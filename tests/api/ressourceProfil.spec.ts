import { beforeEach, describe, it } from "node:test";
import * as assert from "assert";
import request from "supertest";
import { creeServeur } from "../../src/api/mpa";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { Profil } from "../../src/metier/profil";
import { adaptateurHorloge } from "../../src/metier/adaptateurHorloge";

describe("Sur demande du profil", function () {
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
      middleware: fabriqueMiddleware(),
      adaptateurHorloge: adaptateurHorloge,
    });
  });

  it("répond 200", async function () {
    const reponse = await request(serveur)
      .get("/profil/jean@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 200);
  });

  it("renvoie les données du profil", async () => {
    const reponse = await request(serveur)
      .get("/profil/jean@beta.fr")
      .set("Accept", "application/json");

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
    const reponse = await request(serveur)
      .get("/profil/inconnu@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 404);
  });

  it("aseptise les paramètres", async () => {
    const jeanInferieurDujardin = {
      email: "jean&lt;Dujardin",
      nom: "Jean Dujardin",
      prenom: "",
      organisation: { nom: "DINUM", siret: "12345678", departement: "33" },
      domainesSpecialite: [],
    };
    await entrepotProfil.ajoute(new Profil(jeanInferieurDujardin));

    const reponse = await request(serveur).get("/profil/jean<Dujardin");

    assert.equal(reponse.status, 200);
    assert.equal(reponse.body.nom, "Jean Dujardin");
  });
});
