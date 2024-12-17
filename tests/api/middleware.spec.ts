import { beforeEach, describe, it } from "node:test";
import { Request, Response } from "express";
import { fabriqueMiddleware, Middleware } from "../../src/api/middleware";
import assert from "assert";
import { createRequest, createResponse } from "node-mocks-http";

describe("Le middleware", () => {
  let requete: Request & { service?: string };
  let reponse: Response;
  let middleware: Middleware;

  beforeEach(() => {
    requete = createRequest();
    reponse = createResponse();
    middleware = fabriqueMiddleware({
      adaptateurJWT: { decode: () => ({ service: "MSS" }) },
    });
  });

  describe("sur demande d'aseptisation", () => {
    it("supprime les espaces au début et à la fin du paramètre", async () => {
      requete.body.param = "  une valeur ";
      let valeurAseptisee;
      const suite = () => (valeurAseptisee = requete.body.param);

      await middleware.aseptise("param")(requete, reponse, suite);

      assert.equal(valeurAseptisee, "une valeur");
    });

    it("prend en compte plusieurs paramètres", async () => {
      requete.body.paramRenseigne = "  une valeur ";
      let valeurAseptisee;
      const suite = () => (valeurAseptisee = requete.body.paramRenseigne);

      await middleware.aseptise("paramAbsent", "paramRenseigne")(
        requete,
        reponse,
        suite,
      );

      assert.equal(valeurAseptisee, "une valeur");
    });

    it("neutralise le code HTML", async () => {
      requete.body.paramRenseigne = '<script>alert("hacked!");</script>';
      const suite = () => (paramRenseigne = requete.body.paramRenseigne);
      let paramRenseigne;

      await middleware.aseptise("paramRenseigne")(requete, reponse, suite);

      assert.equal(
        paramRenseigne,
        "&lt;script&gt;alert(&quot;hacked!&quot;);&lt;&#x2F;script&gt;",
      );
    });

    it("aseptise les paramètres de la requête", async () => {
      requete.params.paramRenseigne = '<script>alert("hacked!");</script>';
      const suite = () => (paramRenseigne = requete.params.paramRenseigne);
      let paramRenseigne;

      await middleware.aseptise("paramRenseigne")(requete, reponse, suite);

      assert.equal(
        paramRenseigne,
        "&lt;script&gt;alert(&quot;hacked!&quot;);&lt;&#x2F;script&gt;",
      );
    });
  });
  describe("sur demande de décodage du jeton", () => {
    it("délègue à l'adaptateur JWT le décodage du jeton", async () => {
      let suiteEstAppele = false;
      const suite = () => {
        suiteEstAppele = true;
      };
      const jeton = "unService-JWT";
      const adaptateurJWT = {
        decode: (jeton: string) => ({ service: jeton.split("-")[0] }),
      };
      middleware = fabriqueMiddleware({ adaptateurJWT });
      requete.headers["authorization"] = `Bearer ${jeton}`;

      await middleware.decodeJeton()(requete, reponse, suite);

      assert.equal(requete.service, "unService");
      assert.equal(suiteEstAppele, true);
    });

    it("reste robuste sans jeton d'authentification", async () => {
      let suiteEstAppele = false;
      const suite = () => {
        suiteEstAppele = true;
      };

      await middleware.decodeJeton()(requete, reponse, suite);

      assert.equal(reponse.statusCode, 401);
      assert.equal(suiteEstAppele, false);
    });

    it("jette une erreur 401 si le décode n'a pas donné de résultat", async () => {
      let suiteEstAppele = false;
      const suite = () => {
        suiteEstAppele = true;
      };
      const adaptateurJWT = {
        decode: (jeton: string) => undefined,
      };
      middleware = fabriqueMiddleware({ adaptateurJWT });
      requete.headers["authorization"] = `Bearer pasbon`;

      await middleware.decodeJeton()(requete, reponse, suite);

      assert.equal(reponse.statusCode, 401);
      assert.equal(suiteEstAppele, false);
    });

    it("jette une erreur 401 si le décode a lancé une erreur", async () => {
      let suiteEstAppele = false;
      const suite = () => {
        suiteEstAppele = true;
      };
      const adaptateurJWT = {
        decode: (jeton: string) => {
          throw new Error("jeton invalide");
        },
      };
      middleware = fabriqueMiddleware({ adaptateurJWT });
      requete.headers["authorization"] = `Bearer pasbon`;

      await middleware.decodeJeton()(requete, reponse, suite);

      assert.equal(reponse.statusCode, 401);
      assert.equal(suiteEstAppele, false);
    });

    it("appelle la suite de la chaine de middleware", async () => {
      let suiteEstAppele = false;
      const suite = () => {
        suiteEstAppele = true;
      };
      requete.headers["authorization"] = `Bearer jeton`;

      await middleware.decodeJeton()(requete, reponse, suite);

      assert.equal(suiteEstAppele, true);
    });
  });
});
