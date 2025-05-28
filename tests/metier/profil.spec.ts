import { describe, it } from "node:test";

import assert from "assert";
import { DonneesCreationProfil, Profil } from "../../src/metier/profil";
import { Organisation } from "../../src/metier/organisation";

describe("Sur construction d'un profil", () => {
  const organisation: Organisation = {
    nom: "DINUM",
    departement: "33",
    siret: "1234",
  };
  const donneesCreationProfil: Partial<DonneesCreationProfil> = {
    prenom: "Jean",
    nom: "Dujardin",
    email: "jeand@beta.fr",
    organisation,
    domainesSpecialite: ["RSSI"],
  };

  it("n'accepte pas un email vide", () => {
    assert.throws(
      () =>
        new Profil({
          ...donneesCreationProfil,
          email: "",
        } as DonneesCreationProfil),
      {
        name: "ErreurDonneesObligatoiresManquantes",
        message: "Le champ [email] est obligatoire",
      },
    );
  });

  it("n'accepte pas un prenom vide", () => {
    assert.throws(
      () =>
        new Profil({
          ...donneesCreationProfil,
          prenom: "",
        } as DonneesCreationProfil),
      {
        name: "ErreurDonneesObligatoiresManquantes",
        message: "Le champ [prenom] est obligatoire",
      },
    );
  });

  it("n'accepte pas un nom vide", () => {
    assert.throws(
      () =>
        new Profil({
          ...donneesCreationProfil,
          nom: "",
        } as DonneesCreationProfil),
      {
        name: "ErreurDonneesObligatoiresManquantes",
        message: "Le champ [nom] est obligatoire",
      },
    );
  });

  it("n'accepte pas une organisation vide", () => {
    let donnees = { ...donneesCreationProfil };
    delete donnees.organisation;
    assert.throws(() => new Profil(donnees as DonneesCreationProfil), {
      name: "ErreurDonneesObligatoiresManquantes",
      message: "Le champ [organisation] est obligatoire",
    });
  });

  it("n'accepte pas un nom d'organisation vide", () => {
    const donneesOrganisation = { ...organisation, nom: "" };
    let donnees = {
      ...donneesCreationProfil,
      organisation: donneesOrganisation,
    };
    assert.throws(() => new Profil(donnees as DonneesCreationProfil), {
      name: "ErreurDonneesObligatoiresManquantes",
      message: "Le champ [organisation.nom] est obligatoire",
    });
  });

  it("n'accepte pas un département d'organisation vide", () => {
    const donneesOrganisation = { ...organisation, departement: "" };
    let donnees = {
      ...donneesCreationProfil,
      organisation: donneesOrganisation,
    };
    assert.throws(() => new Profil(donnees as DonneesCreationProfil), {
      name: "ErreurDonneesObligatoiresManquantes",
      message: "Le champ [organisation.departement] est obligatoire",
    });
  });

  it("n'accepte pas un siret d'organisation vide", () => {
    const donneesOrganisation = { ...organisation, siret: "" };
    let donnees = {
      ...donneesCreationProfil,
      organisation: donneesOrganisation,
    };
    assert.throws(() => new Profil(donnees as DonneesCreationProfil), {
      name: "ErreurDonneesObligatoiresManquantes",
      message: "Le champ [organisation.siret] est obligatoire",
    });
  });

  it("n'accepte pas un champ domaine de spécialité vide", () => {
    let donnees = { ...donneesCreationProfil };
    delete donnees.domainesSpecialite;
    assert.throws(() => new Profil(donnees as DonneesCreationProfil), {
      name: "ErreurDonneesObligatoiresManquantes",
      message: "Le champ [domainesSpecialite] est obligatoire",
    });
  });

  it("n'accepte pas une liste vide de domaines de spécialité", () => {
    assert.throws(
      () =>
        new Profil({
          ...donneesCreationProfil,
          domainesSpecialite: [],
        } as DonneesCreationProfil),
      {
        name: "ErreurDonneesObligatoiresManquantes",
        message: "Le champ [domainesSpecialite] est obligatoire",
      },
    );
  });

  it("transforme son email en minuscule lors de la création", () => {
    const profil = new Profil({
      ...donneesCreationProfil,
      email: "JEAN@beta.fr",
    } as DonneesCreationProfil);

    assert.equal(profil.email, "jean@beta.fr");
  });
});
