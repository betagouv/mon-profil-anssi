import { AdaptateurJWT, ContenuJeton } from "../../src/api/adaptateurJWT";

export const fauxAdaptateurJWT: AdaptateurJWT = {
  signeDonnees(donnees: any): string {
    return donnees + "-JWT";
  },
  decode(jeton: string): ContenuJeton | undefined {
    return { service: jeton.split("-")[0], iat: 0 };
  },
};
