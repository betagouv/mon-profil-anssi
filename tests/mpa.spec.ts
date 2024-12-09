import { describe, it, test } from "node:test";
import * as assert from "assert";
import request from "supertest";
import { creeServeur } from "../src/mpa.js";

describe("Sur demande du profil", function () {
  it("répond 200", async function () {
    const reponse = await request(creeServeur())
      .get("/profil?email=connu@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 200);
  });

  it("renvoie les données du profil", async () => {
    const reponse = await request(creeServeur())
      .get("/profil?email=connu@beta.fr")
      .set("Accept", "application/json");

    assert.deepEqual(reponse.body, {
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
    const reponse = await request(creeServeur())
      .get("/profil?email=inconnu@beta.fr")
      .set("Accept", "application/json");

    assert.equal(reponse.status, 404);
  });
});
