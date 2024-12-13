import { beforeEach, describe, it } from "node:test";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { creeServeur } from "../../src/api/mpa";
import { fabriqueMiddleware } from "../../src/api/middleware";
import request from "supertest";
import assert from "assert";
import { Profil } from "../../src/metier/profil";
import { adaptateurHorloge } from "../../src/metier/adaptateurHorloge";

describe("Sur demande d'inscription", () => {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire();
    const adaptateurHorloge = {
      maintenant: () => new Date("2024-12-25"),
    };
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware(),
      adaptateurHorloge,
    });
  });

  it("ajoute le profil", async () => {
    const reponse = await request(serveur)
      .post("/inscription")
      .send({ email: "jean@beta.fr" });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(reponse.status, 201);
    assert.equal(profil!.email, "jean@beta.fr");
  });

  it("aseptise les paramètres", async () => {
    await request(serveur).post("/inscription").send({
      email: "  jean@beta.fr",
      prenom: ">Jean",
      nom: "<Dujardin",
    });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(profil!.email, "jean@beta.fr");
    assert.equal(profil!.prenom, "&gt;Jean");
    assert.equal(profil!.nom, "&lt;Dujardin");
  });

  it("inscrit l'utilisateur au service", async () => {
    await request(serveur).post("/inscription").set("x-id-client", "mss").send({
      email: "jean@beta.fr",
      prenom: "Jean",
      nom: "Dujardin",
    });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(profil!.estInscritA("mss"), true);
    assert.deepStrictEqual(
      profil!.dateDInscriptionA("mss"),
      new Date("2024-12-25"),
    );
  });

  describe("pour un utilisateur déjà inscrit", () => {
    beforeEach(async () => {
      const profilInscrit = new Profil({
        email: "jean@beta.fr",
        nom: "Dujardin",
        prenom: "Jean",
      });
      profilInscrit.inscrisAuService("mss", adaptateurHorloge);
      await entrepotProfil.ajoute(profilInscrit);
    });

    it("ne l'ajoute pas une seconde fois à l'entrepôt", async () => {
      await request(serveur)
        .post("/inscription")
        .set("x-id-client", "mac")
        .send({
          email: "jean@beta.fr",
          prenom: "Jean",
          nom: "Dujardin",
        });

      assert.equal(entrepotProfil.nombre(), 1);
    });

    it("met à jour ses services", async () => {
      await request(serveur)
        .post("/inscription")
        .set("x-id-client", "mac")
        .send({
          email: "jean@beta.fr",
          prenom: "Jean",
          nom: "Dujardin",
        });

      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.estInscritA("mss"), true);
      assert.equal(profil!.estInscritA("mac"), true);
    });

    it("accepte la réinscription à un service", async () => {
      const reponse = await request(serveur)
        .post("/inscription")
        .set("x-id-client", "mss")
        .send({
          email: "jean@beta.fr",
          prenom: "Jean",
          nom: "Dujardin",
        });

      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.nombreInscriptions(), 1);
      assert.equal(reponse.status, 200);
    });
  });
});
