import { ErreurDonneesObligatoiresManquantes } from "./erreurDonneesObligatoiresManquantes";

export interface Organisation {
  nom: string;
  siret: string;
  departement: string;
}

export const valideOrganisation = (organisation: Organisation) => {
  if (!organisation.nom)
    throw new ErreurDonneesObligatoiresManquantes("organisation.nom");
  if (!organisation.departement)
    throw new ErreurDonneesObligatoiresManquantes("organisation.departement");
  if (!organisation.siret)
    throw new ErreurDonneesObligatoiresManquantes("organisation.siret");
};
