import { Profil } from "../../src/metier/profil";
import { EntrepotProfil } from "../../src/metier/entrepotProfil";
import { AdaptateurHachage } from "../../src/persistance/adaptateurHachage";

export class EntrepotProfilMemoire implements EntrepotProfil {
  items: Record<string, Profil> = {};
  adaptateurHachage: AdaptateurHachage;

  constructor({ adaptateurHachage }: { adaptateurHachage: AdaptateurHachage }) {
    this.adaptateurHachage = adaptateurHachage;
  }

  async parEmail(email: string): Promise<Profil | undefined> {
    const donneesProfil = this.items[this.hashEmail(email)];
    if (!donneesProfil) return undefined;
    const profil = new Profil(donneesProfil);
    profil.inscriptions = [...donneesProfil.inscriptions];
    return profil;
  }

  async ajoute(profil: Profil) {
    const emailHash = this.hashEmail(profil.email);
    if (this.items[emailHash])
      throw new Error("Le profil existe déjà dans l'entrepôt")
    this.items[emailHash] = profil;
  }

  async metsAJour(profil: Profil): Promise<void> {
    const profilTrouve = this.items[this.hashEmail(profil.email)];
    if (!profilTrouve) return;

    this.items[this.hashEmail(profil.email)] = profil;
  }

  nombre() {
    return Object.keys(this.items).length;
  }

  private hashEmail(email: string) {
    return this.adaptateurHachage.hacheSha256(email);
  }
}
