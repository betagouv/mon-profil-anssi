import { ContenuJeton } from "../../src/api/adaptateurJWT";
import { ServiceRevocationJeton } from "../../src/api/middleware";

export const fauxServiceRevocationJeton: ServiceRevocationJeton = {
  estRevoque: async (_: ContenuJeton) => false,
};
