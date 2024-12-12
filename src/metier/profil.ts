export class Profil {
  email: string;
  nom: string;
  prenom: string;

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

  estInscritA(service: string): boolean{
    return true;
  }
}
