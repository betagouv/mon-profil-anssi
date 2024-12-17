import { AdaptateurJWT, ContenuJeton } from "../../src/api/adaptateurJWT";

export const fauxAdaptateurJWT: AdaptateurJWT = {
  decode(jeton: string): ContenuJeton | undefined {
    return { service: jeton.split("-")[0] };
  },
};
