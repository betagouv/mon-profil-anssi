import { Profil } from "../../src/metier/profil";
import { EntrepotProfil } from "../../src/metier/entrepotProfil";

export class EntrepotProfilMemoire implements EntrepotProfil {
  items: Profil[] = [];

  async parEmail(email: string): Promise<Profil | undefined> {
    const donneesProfil = this.items.find((p) => p.email === email);
    if (!donneesProfil) return undefined;
    const profil = new Profil(donneesProfil);
    profil.inscriptions = [...donneesProfil.inscriptions];
    return profil;
  }

  async ajoute(profil: Profil) {
    this.items.push(profil);
  }

  async metsAJour(profil: Profil): Promise<void> {
    const profilTrouve = this.items.find((p) => p.email === profil.email);
    if (!profilTrouve) return;

    this.items[this.items.indexOf(profilTrouve)] = profil;
  }

  nombre() {
    return this.items.length;
  }
}
