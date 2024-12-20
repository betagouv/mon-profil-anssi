import { beforeEach, describe, it } from "node:test";
import { EntrepotRevocationJetonMemoire } from "../persistance/entrepotRevocationJetonMemoire";
import {
  EntrepotRevocationJeton,
  fabriqueServiceRevocationJeton,
  ServiceRevocationJeton,
} from "../../src/api/serviceRevocationJeton";
import assert from "assert";

describe("Le service de révocation de jeton", () => {
  describe("sur demande si un jeton est révoqué", () => {
    let serviceRevocationJeton: ServiceRevocationJeton;
    let entrepotRevocationJeton: EntrepotRevocationJeton;
    beforeEach(() => {
      entrepotRevocationJeton = new EntrepotRevocationJetonMemoire();
      serviceRevocationJeton = fabriqueServiceRevocationJeton({
        entrepotRevocationJeton,
      });
    });

    it("répond oui si la date de fin de révocation est postérieure pour ce service", async () => {
      await entrepotRevocationJeton.ajoute({
        service: "mss",
        dateFinRevocation: new Date("2022-01-01"),
      });

      let estRevoque = await serviceRevocationJeton.estRevoque({
        service: "mss",
        iat: new Date("2021-01-01").getTime() / 1000,
      });

      assert.equal(estRevoque, true);
    });

    it("répond non si le service n'a pas de révocation", async () => {
      await entrepotRevocationJeton.ajoute({
        service: "mss",
        dateFinRevocation: new Date("2022-01-01"),
      });

      let estRevoque = await serviceRevocationJeton.estRevoque({
        service: "mac",
        iat: new Date("2021-01-01").getTime() / 1000,
      });

      assert.equal(estRevoque, false);
    });

    it("répond non si la date de fin de révocation est antérieure pour ce service", async () => {
      await entrepotRevocationJeton.ajoute({
        service: "mss",
        dateFinRevocation: new Date("2022-01-01"),
      });

      let estRevoque = await serviceRevocationJeton.estRevoque({
        service: "mss",
        iat: new Date("2023-01-01").getTime() / 1000,
      });

      assert.equal(estRevoque, false);
    });
  });
});
