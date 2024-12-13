import { AdaptateurHorloge } from "./adaptateurHorloge";
import { Inscription } from "./inscription";

export class Profil {
  email: string;
  nom: string;
  prenom: string;
  inscriptions: Inscription[] = [];
  constructor({
    email,
    nom,
    prenom,
  }: {
    email: string;
    nom: string;
    prenom: string;
  }) {
    this.email = email;
    this.nom = nom;
    this.prenom = prenom;
  }

  inscrisAuService(service: string, adaptateurHorloge: AdaptateurHorloge) {
    this.inscriptions.push(
      new Inscription(service, adaptateurHorloge.maintenant()),
    );
  }

  estInscritA(service: string): boolean {
    return this.inscriptions.some(
      (inscription) => inscription.service === service,
    );
  }

  dateDInscriptionA(service: string): Date | undefined {
    return this.inscriptions.find(
      (inscription) => inscription.service === service,
    )?.date;
  }

  nombreInscriptions() {
    return this.inscriptions.length;
  }
}
