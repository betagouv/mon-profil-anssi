import { Express } from "express";
import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import request from "supertest";
import { AdaptateurEnvironnement } from "../../src/adaptateurEnvironnement";
import { fabriqueMiddleware } from "../../src/api/middleware";
import { creeServeur } from "../../src/api/mpa";
import { Profil } from "../../src/metier/profil";
import { fabriqueAdaptateurHachage } from "../../src/persistance/adaptateurHachage";
import { EntrepotProfilMemoire } from "../persistance/entrepotProfil.memoire";
import { fauxAdaptateurJWT } from "./fauxAdaptateurJWT";
import { fauxServiceRevocationJeton } from "./fauxServiceRevocationJeton";

const jeanDujardin = {
    email: "jean@beta.fr",
    nom: "Dujardin",
    prenom: "Jean",
    organisation: { nom: "DINUM", siret: "12345678", departement: "33" },
    domainesSpecialite: ["RSSI", "JURI"],
    telephone: "0607080910",
};

const jeanneDujardin = {
    email: "jeanne@beta.fr",
    nom: "Dujardin",
    prenom: "Jeanne",
    organisation: { nom: "DINUM", siret: "12345678", departement: "33" },
    domainesSpecialite: ["RSSI", "JURI"],
    telephone: "0607080910",
};


describe("La ressource de recherche de profils", () => {
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
    let entrepotProfil: EntrepotProfilMemoire;
    let serveur: Express;

    beforeEach(() => {
        entrepotProfil = new EntrepotProfilMemoire({ adaptateurHachage });
        serveur = creeServeur({
            entrepotProfil,
            middleware: fabriqueMiddleware({
                adaptateurJWT: fauxAdaptateurJWT,
                serviceRevocationJeton: fauxServiceRevocationJeton,
            }),
            adaptateurHorloge: { maintenant: () => new Date("2020-01-01") },
            serveurLab: {
                reseau: {
                    trustProxy: 0,
                    ipAutorisees: false,
                    maxRequetesParMinute: 600,
                },
            },
        });
    });

    it("retourne 200", async () => {
        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({ emails: [] });

        assert.equal(reponse.status, 200);
    });

    it("retourne 401 sans jeton d'authentification", async () => {
        const reponse = await request(serveur).post("/profils/recherche");

        assert.equal(reponse.status, 401);
    });

    it("retourne 400 sans corps de requête", async () => {
        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" });

        assert.equal(reponse.status, 400);
    });

    it("retourne 400 si le champs emails n'est pas un tableau", async () => {
        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({ "emails": "" });

        assert.equal(reponse.status, 400);
    });

    it("retourne le profil demandé", async () => {
        entrepotProfil.ajoute(new Profil(jeanDujardin));

        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({
                emails: [
                    "jean@beta.fr"
                ]
            });

        assert.equal(reponse.body.length, 1);
        assert.equal(reponse.body[0].nom, "Dujardin");
    });

    it("retourne les profils demandés", async () => {
        entrepotProfil.ajoute(new Profil(jeanDujardin));
        entrepotProfil.ajoute(new Profil(jeanneDujardin));

        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({
                emails: [
                    "jean@beta.fr",
                    "jeanne@beta.fr"
                ]
            });

        assert.equal(reponse.body.length, 2);
        assert.equal(reponse.body[0].prenom, "Jean");
        assert.equal(reponse.body[1].prenom, "Jeanne");
    });

    it("ne retourne rien si les profils demandés n'existent pas", async () => {
        entrepotProfil.ajoute(new Profil(jeanDujardin));
        entrepotProfil.ajoute(new Profil(jeanneDujardin));

        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({
                emails: [
                    "nexistepas@beta.fr",
                    "nexistetoujourspas@beta.fr"
                ]
            });

        assert.equal(reponse.body.length, 0);
    });

    it("ne retourne rien si aucun email n'est fourni", async () => {
        entrepotProfil.ajoute(new Profil(jeanDujardin));
        entrepotProfil.ajoute(new Profil(jeanneDujardin));

        const reponse = await request(serveur)
            .post("/profils/recherche")
            .auth("mss-JWT", { type: "bearer" })
            .send({
                emails: []
            });

        assert.equal(reponse.body.length, 0);
    });
});
