import { ContenuJeton } from "./adaptateurJWT";
import { EntrepotRevocationJeton } from "./entrepotRevocationJeton";

export interface ServiceRevocationJeton {
  estRevoque: (jeton: ContenuJeton) => Promise<boolean>;
}

export const fabriqueServiceRevocationJeton = ({
  entrepotRevocationJeton,
}: {
  entrepotRevocationJeton: EntrepotRevocationJeton;
}) => {
  const estRevoque = async (jeton: ContenuJeton) => {
    const revocationJeton = await entrepotRevocationJeton.pourService(
      jeton.service,
    );
    if (!revocationJeton) {
      return false;
    }
    return new Date(jeton.iat * 1000) < revocationJeton.dateFinRevocation;
  };
  return { estRevoque };
};
