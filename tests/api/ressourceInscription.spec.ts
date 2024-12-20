import { beforeEach, describe, it } from "node:test";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { creeServeur } from "../../src/api/mpa";
import { fabriqueMiddleware } from "../../src/api/middleware";
import request from "supertest";
import assert from "assert";
import { Profil } from "../../src/metier/profil";
import { adaptateurHorloge } from "../../src/metier/adaptateurHorloge";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";
import { fauxServiceRevocationJeton } from "./fauxServiceRevocationJeton";

describe("Sur demande d'inscription", () => {
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

  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire();
    const adaptateurHorloge = {
      maintenant: () => new Date("2024-12-25"),
    };
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware({
        adaptateurJWT: fauxAdaptateurJWT,
        serviceRevocationJeton: fauxServiceRevocationJeton,
      }),
      adaptateurHorloge,
    });
  });

  it("ajoute le profil", async () => {
    const reponse = await request(serveur)
      .post("/inscription")
      .set("Authorization", "Bearer mss-JWT")
      .send(jeanDujardin);

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(reponse.status, 201);
    assert.equal(profil!.email, "jean@beta.fr");
  });

  it("aseptise les paramètres", async () => {
    await request(serveur)
      .post("/inscription")
      .set("Authorization", "Bearer mss-JWT")
      .send({
        email: "  jean@beta.fr",
        prenom: ">Jean",
        nom: "<Dujardin",
        telephone: "<Telephone",
        domainesSpecialite: ["<DomainesSpecialite1", "<DomainesSpecialite2"],
        organisation: {
          nom: ">Nom",
          siret: ">Siret",
          departement: ">33",
        },
      });

    const profil = await entrepotProfil.parEmail("jean@beta.fr");
    assert.equal(profil!.email, "jean@beta.fr");
    assert.equal(profil!.prenom, "&gt;Jean");
    assert.equal(profil!.nom, "&lt;Dujardin");
    assert.equal(profil!.telephone, "&lt;Telephone");
    assert.deepEqual(profil!.domainesSpecialite, [
      "&lt;DomainesSpecialite1",
      "&lt;DomainesSpecialite2",
    ]);
    assert.equal(profil!.organisation.nom, "&gt;Nom");
    assert.equal(profil!.organisation.siret, "&gt;Siret");
    assert.equal(profil!.organisation.departement, "&gt;33");
  });

  it("jette une erreur 400 en cas d'erreur de validation", async () => {
    const reponse = await request(serveur)
      .post("/inscription")
      .set("Authorization", "Bearer mss-JWT")
      .send({});

    assert.equal(reponse.badRequest, true);
    assert.equal(reponse.body.erreur, "Le champ [email] est obligatoire");
  });

  it("inscrit l'utilisateur au service", async () => {
    await request(serveur)
      .post("/inscription")
      .set("Authorization", "Bearer mss-JWT")
      .send(jeanDujardin);

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
        domainesSpecialite: ["RSSI"],
        organisation: { nom: "DINUM", departement: "33", siret: "12345" },
        telephone: "1234",
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
        .set("Authorization", "Bearer mac-JWT")
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
        .set("Authorization", "Bearer mss-JWT")
        .send({
          email: "jean@beta.fr",
          prenom: "Jean",
          nom: "Dujardin",
        });

      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.nombreInscriptions(), 1);
      assert.equal(reponse.status, 200);
    });

    it("mets à jour le profil avec de nouvelles informations", async () => {
      await request(serveur)
        .post("/inscription")
        .set("Authorization", "Bearer mac-JWT")
        .send({
          email: "jean@beta.fr",
          prenom: "Jeanne",
          nom: "Dujardine",
          organisation: { nom: "ANSSI", departement: "75", siret: "9876" },
          telephone: "0606",
          domainesSpecialite: ["JURI"],
        });

      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.prenom, "Jeanne");
      assert.equal(profil!.nom, "Dujardine");
      assert.equal(profil!.telephone, "0606");
      assert.deepEqual(profil!.organisation, {
        nom: "ANSSI",
        departement: "75",
        siret: "9876",
      });
      assert.deepEqual(profil!.domainesSpecialite, ["JURI"]);
    });

    it("n'écrase pas le profil avec des informations non fournies", async () => {
      await request(serveur)
        .post("/inscription")
        .set("Authorization", "Bearer mac-JWT")
        .send({ email: "jean@beta.fr" });

      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.prenom, "Jean");
      assert.equal(profil!.nom, "Dujardin");
      assert.equal(profil!.telephone, "1234");
      assert.deepEqual(profil!.organisation, {
        nom: "DINUM",
        departement: "33",
        siret: "12345",
      });
      assert.deepEqual(profil!.domainesSpecialite, ["RSSI"]);
    });

    it("n'écrase pas le profil avec des informations vides", async () => {
      let reponse = await request(serveur)
        .post("/inscription")
        .set("Authorization", "Bearer mac-JWT")
        .send({
          email: "jean@beta.fr",
          organisation: {},
          nom: "",
          domainesSpecialite: [],
          prenom: "",
          telephone: "",
        });

      assert.equal(reponse.status, 201);
      const profil = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profil!.prenom, "Jean");
      assert.equal(profil!.nom, "Dujardin");
      assert.equal(profil!.telephone, "1234");
      assert.deepEqual(profil!.organisation, {
        nom: "DINUM",
        departement: "33",
        siret: "12345",
      });
      assert.deepEqual(profil!.domainesSpecialite, ["RSSI"]);
    });
  });
});
