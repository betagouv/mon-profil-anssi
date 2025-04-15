import { fabriqueEntrepotProfilPostgres } from "../persistance/entrepotProfil.postgres";
import { fabriqueAdaptateurChiffrement } from "../persistance/adaptateurChiffrement";
import { adaptateurEnvironnement } from "../adaptateurEnvironnement";
import { fabriqueAdaptateurHachage } from "../persistance/adaptateurHachage";

export const ConsoleAnalyseDonnees = {
  async utilisateurParEmail(email: string) {
    const entrepotProfil = fabriqueEntrepotProfilPostgres({
      adaptateurChiffrement: fabriqueAdaptateurChiffrement({
        adaptateurEnvironnement,
      }),
      adaptateurHachage: fabriqueAdaptateurHachage({ adaptateurEnvironnement }),
    });
    console.log(await entrepotProfil.parEmail(email));
  },
};
