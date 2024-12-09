import { Profil } from "./profil";

export interface EntrepotProfil {
  parEmail(email: string): Profil | undefined;
}
