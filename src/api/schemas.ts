import * as z from "zod";

export const schemaLectureProfil = z.object({params: z.strictObject({email: z.email()})});

export const schemaParametresPourMiseAJourProfil = z.object({params: z.strictObject({
  email: z.email("L'adresse email existante est invalide"),
})});

export const schemaCorpsPourMiseAJourProfil = z.object({
  body: z.strictObject({
    email: z.email("L'adresse email à mettre à jour est invalide").optional(),
    nom: z.string('Le nom est invalide').max(1024).optional(),
    prenom: z.string('Le prénom est invalide').max(1024).optional(),
    organisation: z.any().superRefine((valeur, contexte) => {
      if (typeof valeur === 'object' && valeur !== null) {
        if (Object.keys(valeur).length === 0) return;

        if (valeur.nom === undefined || typeof valeur.nom !== 'string' || valeur.nom.length > 1024) {
          contexte.addIssue({ code: "custom", message: "Le nom de l'organisation est invalide" })
        }

        if (valeur.siret === undefined || typeof valeur.siret !== 'string' || !/^\d{14}/.test(valeur.siret)) {
          contexte.addIssue({ code: "custom", message: "Le siret de l'organisation est invalide" })
        }

        if (valeur.departement === undefined || typeof valeur.departement !== 'string' || valeur.departement.length in [2, 3]) {
          contexte.addIssue({ code: "custom", message: "Le département de l'organisation est invalide" })
        }

        return z.NEVER;
      }

      contexte.addIssue({ code: "custom", message: "L'organisation est invalide" })
      return z.NEVER;
    }).optional(),
    domainesSpecialite: z.array(z.string('Les domaines de spécialité sont invalides').max(42), 'Les domaines de spécialité sont invalides').max(100, 'Les domaines de spécialité sont invalides').optional(),
    telephone: z.string('Le numéro de téléphone est invalide').max(20, 'Le numéro de téléphone est invalide').optional(),
  }),
});
