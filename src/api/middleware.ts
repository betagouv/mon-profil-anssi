import { NextFunction, Request, Response } from "express";
import * as z from 'zod';
import { AdaptateurJWT } from "./adaptateurJWT";
import { ServiceRevocationJeton } from "./serviceRevocationJeton";

type FonctionMiddleware = (
  requete: Request,
  reponse: Response,
  suite: NextFunction,
) => Promise<void>;

export type Middleware = {
  decodeJeton: () => FonctionMiddleware;
  valideRequete: <TZod extends z.ZodType, TReq extends z.infer<TZod>>(objet: TZod) => (requete: TReq & Request, reponse: Response, suite: NextFunction) => Promise<void | Response>;
};

export const fabriqueMiddleware = ({
  adaptateurJWT,
  serviceRevocationJeton,
}: {
  adaptateurJWT: AdaptateurJWT;
  serviceRevocationJeton: ServiceRevocationJeton;
}): Middleware => {
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
      console.log("Exception inattendue: ", e);
      reponse.sendStatus(401);
      return;
    }
    suite();
  };

  const valideRequete =
    <TZod extends z.ZodType, TReq extends z.infer<TZod>>(objet: TZod) =>
    async (requete: TReq & Request, reponse: Response, suite: NextFunction) => {
      const resultat = objet.safeParse(requete) as z.ZodSafeParseResult<z.core.output<TZod>>;
      if (!resultat.success) return reponse.status(400).send({erreurs: z.flattenError(resultat.error)});
      return suite();
    };

  return {
    decodeJeton,
    valideRequete,
  };
};
