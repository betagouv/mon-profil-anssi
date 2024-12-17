import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { AdaptateurJWT } from "./adaptateurJWT";

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
}: {
  adaptateurJWT: AdaptateurJWT;
}): Middleware => {
  const aseptise =
    (...nomsParametres: string[]) =>
    async (requete: any, _reponse: any, suite: any) => {
      const aseptisations = nomsParametres.map((p) =>
        check(p).trim().escape().run(requete),
      );
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
