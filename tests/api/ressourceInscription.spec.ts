import { beforeEach, describe, it } from "node:test";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { creeServeur } from "../../src/api/mpa";
import { fabriqueMiddleware } from "../../src/api/middleware";
import request from "supertest";
import assert from "assert";
import { Profil } from "../../src/metier/profil";

describe("Sur demande d'inscription", () => {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire();
    serveur = creeServeur({ entrepotProfil, middleware: fabriqueMiddleware() });
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
  });

  it("met à jour les services d'un utilisateur déjà inscrit", async () => {
    const profilInscrit = new Profil({
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
    });
    profilInscrit.inscrisAuService("mss");
    await entrepotProfil.ajoute(profilInscrit);

    await request(serveur).post("/inscription").set("x-id-client", "mac").send({
      email: "jean@beta.fr",
      prenom: "Jean",
      nom: "Dujardin",
    });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(profil!.estInscritA("mss"), true);
    assert.equal(profil!.estInscritA("mac"), true);
  });

  it("ne permets pas la réinscription à un service", async () => {
    const profilInscrit = new Profil({
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
    });
    profilInscrit.inscrisAuService("mss");
    await entrepotProfil.ajoute(profilInscrit);

    const reponse = await request(serveur)
      .post("/inscription")
      .set("x-id-client", "mss")
      .send({
        email: "jean@beta.fr",
        prenom: "Jean",
        nom: "Dujardin",
      });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.deepEqual(profil!.services, ["mss"]);
    assert.equal(reponse.status, 200);
  });
});
