import { Profil } from "../metier/profil";

export type ProfilDb = Omit<Profil, "domainesSpecialite"> & {
  domaines_specialite: string[];
};
