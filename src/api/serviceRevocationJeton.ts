import { ContenuJeton } from "./adaptateurJWT";

export interface ServiceRevocationJeton {
  estRevoque: (jeton: ContenuJeton) => Promise<boolean>;
}

export type RevocationJeton = { service: string; dateFinRevocation: Date };

export interface EntrepotRevocationJeton {
  ajoute(revocationJeton: RevocationJeton): Promise<void>;
  pourService(service: string): Promise<RevocationJeton | undefined>;
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
