import { ContenuJeton } from "../../src/api/adaptateurJWT";
import { ServiceRevocationJeton } from "../../src/api/serviceRevocationJeton";

export const fauxServiceRevocationJeton: ServiceRevocationJeton = {
  estRevoque: async (_: ContenuJeton) => false,
};
