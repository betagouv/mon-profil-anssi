import { Profil } from "../metier/profil";
import { Organisation } from "../metier/organisation";

type ProfilAPI = {
  email: string;
  nom: string;
  prenom: string;
  organisation: Organisation;
  domainesSpecialite: string[];
  telephone?: string;
};

export const versProfilAPI = (profil: Profil): ProfilAPI => ({
  email: profil.email,
  nom: profil.nom,
  prenom: profil.prenom,
  organisation: profil.organisation,
  domainesSpecialite: profil.domainesSpecialite,
  telephone: profil.telephone,
});
