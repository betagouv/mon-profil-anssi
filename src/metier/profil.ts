export class Profil {
  email: string;
  nom: string;
  prenom: string;
  services: string[] = [];

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
    this.services.push(service);
  }

  estInscritA(service: string): boolean {
    return this.services.includes(service);
  }
}
