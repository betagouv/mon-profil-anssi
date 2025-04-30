import swagger_autogen from "swagger-autogen";

const configureLaDocumentationSwagger = swagger_autogen();

const donneesProfil = {
  nom: "Dujardin",
  prenom: "Jean",
  organisation: {
    nom: "ANSSI",
    siret: "13000766900018",
    departement: "75",
  },
  domainesSpecialite: ["RSSI"],
  telephone: "0601020304",
};

const doc = {
  info: {
    title: "MonProfilANSSI",
    description:
      "L'API d'identification d'utilisateur pour les services du Lab. Innovation de l'ANSSI",
    version: "1.0.0",
  },
  definitions: {
    Profil: donneesProfil,
    Inscriptions: {
      dateInscription: "2025-01-01",
      donneesProfil,
    },
    Erreur: {
      erreur: "Le champ [nom] est obligatoire",
    },
    ErreursInscriptions: [
      {
        email: "jean.dujardin@beta.gouv.fr",
        erreur: "Le champ [nom] est obligatoire",
      },
    ],
  },
  securityDefinitions: {
    "Bearer token": {
      type: "bearerToken",
      in: "header",
      name: "authorization",
      description: "Clé d'authentification, au format 'Bearer XXX'",
    },
  },
};

const outputFile = "../../dist/public/swagger.json";
const routes = ["./mpa.ts"];

const genereDocumentation = async () =>
  await configureLaDocumentationSwagger(outputFile, routes, doc);

genereDocumentation()
  .then(() => console.log("✅ Documentation générée avec succès"))
  .catch((e) =>
    console.error(`❌ Erreur lors de la génération de la documentation: ${e}`),
  );
