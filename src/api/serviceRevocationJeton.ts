import { ContenuJeton } from "./adaptateurJWT";

export interface ServiceRevocationJeton {
  estRevoque: (jeton: ContenuJeton) => Promise<boolean>;
}

export const fabriqueServiceRevocationJeton = () => {
  const estRevoque = async (jeton: ContenuJeton) => false;
  return { estRevoque };
};
