import { AdaptateurHorloge } from "./adaptateurHorloge";
import { Inscription } from "./inscription";
import { Organisation } from "./organisation";

type DonneesCreationProfil = {
  email: string;
  nom: string;
  prenom: string;
  organisation: Organisation;
  domainesSpecialite: string[];
  telephone?: string;
};

type DonneesMiseAJourProfil = Omit<Partial<DonneesCreationProfil>, 'email'>;

export class Profil {
  email: string;
  nom: string;
  prenom: string;
  organisation: Organisation;
  domainesSpecialite: string[];
  telephone?: string;
  inscriptions: Inscription[] = [];

  constructor({
    email,
    nom,
    prenom,
    organisation,
    domainesSpecialite,
    telephone,
  }: DonneesCreationProfil) {
    this.email = email;
    this.nom = nom;
    this.prenom = prenom;
    this.organisation = organisation;
    this.domainesSpecialite = domainesSpecialite;
    this.telephone = telephone;
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

  metsAJour({
    prenom,
    nom,
    telephone,
    organisation,
    domainesSpecialite,
  }: DonneesMiseAJourProfil) {
    if (prenom) this.prenom = prenom;
    if (nom) this.nom = nom;
    if (telephone) this.telephone = telephone;
    if (organisation) this.organisation = organisation;
    if (domainesSpecialite) this.domainesSpecialite = domainesSpecialite;
  }
}
