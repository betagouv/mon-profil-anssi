import { Profil } from "./profil";

export interface EntrepotProfil {
  parEmail(email: string): Promise<Profil | undefined>;
  ajoute(profil: Profil): Promise<void>;
}
