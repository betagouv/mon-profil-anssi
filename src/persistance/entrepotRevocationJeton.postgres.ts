import { db } from "./knexfile";
import { EntrepotRevocationJeton } from "../api/entrepotRevocationJeton";
import { RevocationJeton } from "../api/revocationJeton";

export const entrepotRevocationJetonPostgres: EntrepotRevocationJeton = {
  async ajoute(revocationJeton: RevocationJeton) {
    await db("revocations_jeton").insert({
      service: revocationJeton.service,
      date_fin_revocation: revocationJeton.dateFinRevocation,
    });
  },
  async pourService(service: string): Promise<RevocationJeton | undefined> {
    let donnees = await db("revocations_jeton")
      .where({ service })
      .orderBy("date_fin_revocation", "desc")
      .first()
      .select();
    if (!donnees) {
      return undefined;
    }
    return {
      service: donnees.service,
      dateFinRevocation: donnees.date_fin_revocation,
    };
  },
};
