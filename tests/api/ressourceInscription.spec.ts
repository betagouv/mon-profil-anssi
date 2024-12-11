import {beforeEach, describe, it} from "node:test";
import {Express} from "express";
import {EntrepotProfilMemoire} from "../persistance/entrepotProfil.memoire";
import {creeServeur} from "../../src/api/mpa";
import {fabriqueMiddleware} from "../../src/api/middleware";
import request from "supertest";
import assert from "assert";

describe("Sur demande d'inscription", () => {
    let serveur: Express;
    let entrepotProfil: EntrepotProfilMemoire;

    beforeEach(() => {
        entrepotProfil = new EntrepotProfilMemoire();
        serveur = creeServeur({entrepotProfil, middleware: fabriqueMiddleware()});
    });

    it("ajoute le profil", async () => {
        const reponse = await request(serveur)
            .post("/inscription")
            .send({
                email: 'jean@beta.fr'
            });

        assert.equal(reponse.status, 201);
        assert.deepEqual(await entrepotProfil.parEmail('jean@beta.fr'), {
            email: 'jean@beta.fr'
        });
    });
});