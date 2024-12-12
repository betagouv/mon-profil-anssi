import { Profil } from "../metier/profil";

type ProfilAPI = {
  email: string;
  nom: string;
  prenom: string;
};

export const versProfilAPI = (profil: Profil): ProfilAPI => ({
  email: profil.email,
  nom: profil.nom,
  prenom: profil.prenom,
});
