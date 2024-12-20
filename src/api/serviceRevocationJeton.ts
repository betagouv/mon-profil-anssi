import { ContenuJeton } from "./adaptateurJWT";
import { EntrepotRevocationJeton } from "./entrepotRevocationJeton";
import { AdaptateurHorloge } from "../metier/adaptateurHorloge";

export interface ServiceRevocationJeton {
  estRevoque: (jeton: ContenuJeton) => Promise<boolean>;

  revoquePour(service: string): Promise<void>;
}

export const fabriqueServiceRevocationJeton = ({
  entrepotRevocationJeton,
  adaptateurHorloge,
}: {
  entrepotRevocationJeton: EntrepotRevocationJeton;
  adaptateurHorloge: AdaptateurHorloge;
}): ServiceRevocationJeton => {
  const estRevoque = async (jeton: ContenuJeton) => {
    const revocationJeton = await entrepotRevocationJeton.pourService(
      jeton.service,
    );
    if (!revocationJeton) {
      return false;
    }
    return new Date(jeton.iat * 1000) < revocationJeton.dateFinRevocation;
  };
  const revoquePour = async (service: string): Promise<void> => {
    await entrepotRevocationJeton.ajoute({
      service,
      dateFinRevocation: adaptateurHorloge.maintenant(),
    });
  };
  return { revoquePour, estRevoque };
};
