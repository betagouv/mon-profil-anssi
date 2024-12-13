export class Profil {
  email: string;
  nom: string;
  prenom: string;
  inscriptions: string[] = [];

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

  inscrisAuService(service: string) {
    this.inscriptions.push(service);
  }

  estInscritA(service: string): boolean {
    return this.inscriptions.includes(service);
  }

  nombreInscriptions() {
    return this.inscriptions.length;
  }
}
