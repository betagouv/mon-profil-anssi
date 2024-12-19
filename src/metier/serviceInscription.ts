import { DonneesCreationProfil, Profil } from "./profil";
import { AdaptateurHorloge } from "./adaptateurHorloge";
import { EntrepotProfil } from "./entrepotProfil";

export type ServiceInscription = {
  nouveauProfil: (
    donnees: DonneesCreationProfil,
    service: string,
  ) => Promise<Profil>;
};

export const fabriqueServiceInscription = ({
  adaptateurHorloge,
  entrepotProfil,
}: {
  adaptateurHorloge: AdaptateurHorloge;
  entrepotProfil: EntrepotProfil;
}): ServiceInscription => {
  const nouveauProfil = async (
    donneesCreationProfil: DonneesCreationProfil,
    serviceClient: string,
  ) => {
    const nouveauProfil = new Profil(donneesCreationProfil);
    nouveauProfil.inscrisAuService(serviceClient, adaptateurHorloge);
    await entrepotProfil.ajoute(nouveauProfil);
    return nouveauProfil;
  };

  return {
    nouveauProfil,
  };
};
