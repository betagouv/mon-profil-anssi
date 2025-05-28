import { AdaptateurHorloge } from "./adaptateurHorloge";
import { Inscription } from "./inscription";
import { Organisation, valideOrganisation } from "./organisation";
import { ErreurDonneesObligatoiresManquantes } from "./erreurDonneesObligatoiresManquantes";

export type DonneesCreationProfil = {
  email: string;
  nom: string;
  prenom: string;
  organisation: Organisation;
  domainesSpecialite: string[];
  telephone?: string;
};

type DonneesMiseAJourProfil = Omit<Partial<DonneesCreationProfil>, "email">;

export class Profil {
  email: string;
  nom: string;
  prenom: string;
  organisation: Organisation;
  domainesSpecialite: string[];
  telephone?: string;
  inscriptions: Inscription[] = [];

  constructor(donneesCreationProfil: DonneesCreationProfil) {
    this.valide(donneesCreationProfil);
    const { email, nom, prenom, organisation, domainesSpecialite, telephone } =
      donneesCreationProfil;
    this.email = email.toLowerCase();
    this.nom = nom;
    this.prenom = prenom;
    this.organisation = organisation;
    this.domainesSpecialite = domainesSpecialite;
    this.telephone = telephone;
  }

  private valide({
    email,
    nom,
    prenom,
    organisation,
    domainesSpecialite,
  }: DonneesCreationProfil) {
    if (!email) throw new ErreurDonneesObligatoiresManquantes("email");
    if (!prenom) throw new ErreurDonneesObligatoiresManquantes("prenom");
    if (!nom) throw new ErreurDonneesObligatoiresManquantes("nom");
    if (!domainesSpecialite || domainesSpecialite.length === 0)
      throw new ErreurDonneesObligatoiresManquantes("domainesSpecialite");
    if (!organisation)
      throw new ErreurDonneesObligatoiresManquantes("organisation");
    valideOrganisation(organisation);
  }

  inscrisAuServiceALaDate(service: string, dateInscription: Date) {
    let inscriptionActuelle = this.inscriptionA(service);
    if (inscriptionActuelle) {
      inscriptionActuelle.date = dateInscription;
    } else {
      this.inscriptions.push(new Inscription(service, dateInscription));
    }
  }

  inscrisAuService(service: string, adaptateurHorloge: AdaptateurHorloge) {
    const dejaInscrit = this.estInscritA(service);
    if (dejaInscrit) return;

    this.inscriptions.push(
      new Inscription(service, adaptateurHorloge.maintenant()),
    );
  }

  estInscritA(service: string): boolean {
    return this.inscriptionA(service) !== undefined;
  }

  dateDInscriptionA(service: string): Date | undefined {
    return this.inscriptionA(service)?.date;
  }

  private inscriptionA = (service: string): Inscription | undefined =>
    this.inscriptions.find((inscription) => inscription.service === service);

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
    if (
      organisation &&
      organisation.nom &&
      organisation.siret &&
      organisation.departement
    ) {
      this.organisation = organisation;
    }
    if (domainesSpecialite && domainesSpecialite.length !== 0) {
      this.domainesSpecialite = domainesSpecialite;
    }
  }
}
