import { beforeEach, describe, it } from "node:test";
import * as assert from "assert";
import request from "supertest";
import { creeServeur } from "../../src/api/mpa";
import { Express } from "express";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { Profil } from "../../src/metier/profil";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";
import { fauxServiceRevocationJeton } from "./fauxServiceRevocationJeton";
import { fabriqueAdaptateurHachage } from "../../src/persistance/adaptateurHachage";
import { AdaptateurEnvironnement } from "../../src/adaptateurEnvironnement";

describe("La ressource profil", () => {
  let serveur: Express;
  let entrepotProfil: EntrepotProfilMemoire;
  const adaptateurEnvironnement: AdaptateurEnvironnement = {
    chiffrement: () => ({
      cleChaCha20Hex: () =>
        Buffer.from(
          "634d926d56f195346a23bba72128814c7b1d5a62403d080487657be6a30ad9e2",
          "hex",
        ),
    }),
    hashage: () => ({
      sel: () => "uneSelPourLesTests",
    }),
  };
  const adaptateurHachage = fabriqueAdaptateurHachage({
    adaptateurEnvironnement,
  });

  beforeEach(() => {
    entrepotProfil = new EntrepotProfilMemoire({ adaptateurHachage });
    const jeanDujardin = {
      email: "jean@beta.fr",
      nom: "Dujardin",
      prenom: "Jean",
      organisation: { nom: "DINUM", siret: "13002526500013", departement: "33" },
      domainesSpecialite: ["RSSI", "JURI"],
      telephone: "0607080910",
    };
    entrepotProfil.ajoute(new Profil(jeanDujardin));
    serveur = creeServeur({
      entrepotProfil,
      middleware: fabriqueMiddleware({
        adaptateurJWT: fauxAdaptateurJWT,
        serviceRevocationJeton: fauxServiceRevocationJeton,
      }),
      adaptateurHorloge: { maintenant: () => new Date("2024-12-17") },
      serveurLab: {
        reseau: {
          trustProxy: 0,
          ipAutorisees: false,
          maxRequetesParMinute: 600,
        },
      },
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
        organisation: { nom: "DINUM", siret: "13002526500013", departement: "33" },
        domainesSpecialite: ["RSSI", "JURI"],
        telephone: "0607080910",
      });
    });

    it("répond 404 lorsque le profil est inconnu", async () => {
      const reponse = await requeteGETAuthentifiee("/profil/inconnu@beta.fr");

      assert.equal(reponse.status, 404);
    });

    it("renvoie une erreur 401 si le jeton est invalide", async () => {
      const reponse = await request(serveur)
        .get("/profil/jean@beta.fr")
        .set("Accept", "application/json");

      assert.equal(reponse.status, 401);
    });

    it("rejette les emails invalides", async() => {
      const reponse = await requeteGETAuthentifiee("/profil/pas-un-email");

      assert.equal(reponse.status, 400);
    });

    it("est insensible à la casse de l'email", async () => {
      const reponse = await requeteGETAuthentifiee("/profil/JEAN@beta.fr");

      assert.equal(reponse.body.email, "jean@beta.fr");
    });
  });

  describe("Sur demande de mise à jour du profil", () => {
    const requetePUTAuthentifiee = (url: string) =>
      request(serveur)
        .put(url)
        .auth("mss-JWT", { type: "bearer" })
        .set("Accept", "application/json");

    it("mets à jour le profil connu", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/jean@beta.fr").send(
        {
          nom: "Dujardin2",
          prenom: "Jean2",
          organisation: {
            nom: "DINUM2",
            siret: "13002526500014",
            departement: "332",
          },
          domainesSpecialite: ["RSSI2", "JURI2"],
          telephone: "06070809102",
        },
      );

      assert.equal(reponse.status, 200);
      let profilAJour = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profilAJour!.nom, "Dujardin2");
      assert.equal(profilAJour!.prenom, "Jean2");
      assert.equal(profilAJour!.organisation.nom, "DINUM2");
      assert.equal(profilAJour!.organisation.siret, "13002526500014");
      assert.equal(profilAJour!.organisation.departement, "332");
      assert.deepEqual(profilAJour!.domainesSpecialite, ["RSSI2", "JURI2"]);
      assert.equal(profilAJour!.telephone, "06070809102");
    });

    it("inscris le profil connu au service si ce n'était pas le cas", async () => {
      await request(serveur)
        .put("/profil/jean@beta.fr")
        .auth("autre_service-JWT", { type: "bearer" })
        .set("Accept", "application/json")
        .send({});

      const utiliseAutreService = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(utiliseAutreService?.estInscritA("autre_service"), true);
    });

    it("ne réinscris un profil connu au même service", async () => {
      const huitDecembre = new Date("2024-12-08");
      const jeanAvant = await entrepotProfil.parEmail("jean@beta.fr");
      jeanAvant?.inscrisAuService("mss", { maintenant: () => huitDecembre });
      await entrepotProfil.metsAJour(jeanAvant!);

      await requetePUTAuthentifiee("/profil/jean@beta.fr").send({});

      const jeanApres = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(jeanApres?.nombreInscriptions(), 1);
    });

    describe("si le profil est inconnu", () => {
      it("inscris automatiquement le profil", async () => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/inconnu@beta.fr",
        ).send({
          email: "jean@beta.fr",
          nom: "Dujardin",
          prenom: "Jean",
          organisation: { nom: "DINUM", siret: "13002526500013", departement: "33" },
          domainesSpecialite: ["RSSI"],
          telephone: "0607080910",
        });

        assert.equal(reponse.status, 201);
        let profilAjoute = await entrepotProfil.parEmail("inconnu@beta.fr");
        assert.notEqual(profilAjoute, undefined);
        assert.equal(profilAjoute!.nom, "Dujardin");
        assert.equal(profilAjoute!.prenom, "Jean");
        assert.equal(profilAjoute!.organisation.nom, "DINUM");
        assert.equal(profilAjoute!.organisation.siret, "13002526500013");
        assert.equal(profilAjoute!.organisation.departement, "33");
        assert.deepEqual(profilAjoute!.domainesSpecialite, ["RSSI"]);
        assert.equal(profilAjoute!.telephone, "0607080910");
        assert.equal(profilAjoute?.estInscritA("mss"), true);
        assert.deepStrictEqual(
          profilAjoute!.dateDInscriptionA("mss"),
          new Date("2024-12-17"),
        );
      });

      it("renvoie une erreur 400 lorsque les informations pour le créer sont incomplètes", async () => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/inconnu@beta.fr",
        ).send({
          email: "jean@beta.fr",
          nom: "Dujardin",
        });

        assert.equal(reponse.badRequest, true);
        assert.equal(reponse.body.erreur, "Le champ [prenom] est obligatoire");
      });
    });

    describe("valide les paramètres", async() => {
      const payloadValide = {
        email: "jeandujardin@beta.fr",
        nom: "Dujardin",
        prenom: "Jean",
        organisation: { nom: "DINUM", siret: "13002526500013", departement: "33" },
        domainesSpecialite: ["RSSI", "JURI"],
        telephone: "0607080910",
      };

      it("rejette les emails invalides en paramètre de la requête lors d'une création", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean>@beta.fr",
        ).send({});

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.params[0], "L'adresse email existante est invalide");
      });

      it("rejette les emails invalides en paramètre de la requête lors d'une mise à jour", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean>@beta.fr",
        ).send({
          ...payloadValide,
        });

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.params[0], "L'adresse email existante est invalide");
      });

      it("rejette les emails invalides dans le corps de la requête", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean@beta.fr",
        ).send({
          ...payloadValide,
          email: "pas-un-email",
        });

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.body[0], "L'adresse email à mettre à jour est invalide");
      });

      it("rejette les noms invalides", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean@beta.fr",
        ).send({
          ...payloadValide,
          nom: 42,
        });

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le nom est invalide");
      });

      it("rejette les prénoms invalides", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean@beta.fr",
        ).send({
          ...payloadValide,
          prenom: 42,
        });

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le prénom est invalide");
      });

      describe("rejette les organisations invalides", async() => {
        it("rejette une organisation qui n'a pas la bonne structure de données", async() => {
          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send({
            ...payloadValide,
            organisation: 42,
          });

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "L'organisation est invalide");
        });

        it("rejette une organisation dont le nom est invalide", async() => {
          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send({
            ...payloadValide,
            organisation: {
              ...(payloadValide.organisation),
              nom: 42,
            },
          });

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le nom de l'organisation est invalide");
        });

        it("rejette une organisation dont le siret est invalide", async() => {
          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send({
            ...payloadValide,
            organisation: {
              ...(payloadValide.organisation),
              siret: 42,
            },
          });

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le siret de l'organisation est invalide");
        });

        it("rejette une organisation dont le département est invalide", async() => {
          const envoye = {
            ...payloadValide,
            organisation: {
              ...(payloadValide.organisation),
              departement: 42,
            },
          };

          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send(envoye);

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le département de l'organisation est invalide");
        });
      });

      describe("rejette les domaines de spécialité invalides", async() => {
        it("rejette le domaine de spécialités s'il ne respecte pas la bonne structure de données", async() => {
          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send({
            ...payloadValide,
            domainesSpecialite: 42,
          });

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Les domaines de spécialité sont invalides");
        });

        it("quand les spécilités n'ont pas de sens", async() => {
          const reponse = await requetePUTAuthentifiee(
            "/profil/jean@beta.fr",
          ).send({
            ...payloadValide,
            domainesSpecialite: [42, 4.2],
          });

          assert.equal(reponse.status, 400);
          assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Les domaines de spécialité sont invalides");
        });
      });

      it("rejette les numéros de téléphone invalides", async() => {
        const reponse = await requetePUTAuthentifiee(
          "/profil/jean@beta.fr",
        ).send({
          ...payloadValide,
          telephone: 42,
        });

        assert.equal(reponse.status, 400);
        assert.equal(reponse.body.erreurs.fieldErrors.body[0], "Le numéro de téléphone est invalide");
      });
    });

    it("ignore les informations vides", async () => {
      const reponse = await requetePUTAuthentifiee("/profil/jean@beta.fr").send(
        {
          organisation: {},
          nom: "",
          domainesSpecialite: [],
          prenom: "",
          telephone: "",
        },
      );

      assert.equal(reponse.status, 200);
      let profilAJour = await entrepotProfil.parEmail("jean@beta.fr");
      assert.equal(profilAJour!.nom, "Dujardin");
      assert.equal(profilAJour!.prenom, "Jean");
      assert.equal(profilAJour!.organisation.nom, "DINUM");
      assert.equal(profilAJour!.organisation.siret, "13002526500013");
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

    describe("concernant la casse de l'email", () => {
      it("mets à jour un profil existant, même lorsque les casses diffèrent", async () => {
        await requetePUTAuthentifiee(
          "/profil/JEAN@beta.fr",
        ).send({
          nom: "Dujardin",
          prenom: "JEAN",
          organisation: { nom: "DINUM", siret: "13002526500013", departement: "33" },
          domainesSpecialite: ["RSSI"],
          telephone: "0607080910",
        });

        const jeanAJour = await entrepotProfil.parEmail("jean@beta.fr");
        assert.equal(jeanAJour?.prenom, "JEAN");
      });
    });
  });
});
