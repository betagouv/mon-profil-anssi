import { Profil } from "../../src/metier/profil";
import { EntrepotProfil } from "../../src/metier/entrepotProfil";

export class EntrepotProfilMemoire implements EntrepotProfil {
  items: Profil[] = [];

  async parEmail(email: string): Promise<Profil | undefined> {
    return this.items.find((p) => p.email === email);
  }

  ajoute(profil: Profil) {
    this.items.push(profil);
  }
}
