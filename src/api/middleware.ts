import { body, param, query } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { AdaptateurJWT } from "./adaptateurJWT";
import { ServiceRevocationJeton } from "./serviceRevocationJeton";

type FonctionMiddleware = (
  requete: Request,
  reponse: Response,
  suite: NextFunction,
) => Promise<void>;

export type Middleware = {
  aseptise: (...nomsParametres: string[]) => FonctionMiddleware;
  decodeJeton: () => FonctionMiddleware;
};

export const fabriqueMiddleware = ({
  adaptateurJWT,
  serviceRevocationJeton,
}: {
  adaptateurJWT: AdaptateurJWT;
  serviceRevocationJeton: ServiceRevocationJeton;
}): Middleware => {
  const aseptise =
    (...nomsParametres: string[]) =>
    async (requete: any, _reponse: any, suite: any) => {
      const aseptisations = nomsParametres.flatMap((p) => [
        body(p).trim().escape().run(requete),
        param(p).trim().escape().run(requete),
        query(p).trim().escape().run(requete),
      ]);
      await Promise.all(aseptisations);
      suite();
    };

  const decodeJeton = () => async (requete: any, reponse: any, suite: any) => {
    let header = requete.headers["authorization"];
    if (!header) {
      reponse.sendStatus(401);
      return;
    }
    let jeton = header.split("Bearer ")[1];
    try {
      let contenuJeton = adaptateurJWT.decode(jeton);
      if (!contenuJeton) {
        reponse.sendStatus(401);
        return;
      }
      const estRevoque = await serviceRevocationJeton.estRevoque(contenuJeton);
      if (estRevoque) {
        reponse.sendStatus(401);
        return;
      }
      requete.service = contenuJeton.service;
    } catch (e) {
      reponse.sendStatus(401);
      return;
    }
    suite();
  };

  return {
    aseptise,
    decodeJeton,
  };
};
