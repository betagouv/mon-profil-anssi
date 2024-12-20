import { adaptateurJWT } from "./api/adaptateurJWT";
import { fabriqueServiceRevocationJeton } from "./api/serviceRevocationJeton";
import { entrepotRevocationJetonPostgres } from "./persistance/entrepotRevocationJeton.postgres";
import { adaptateurHorloge } from "./metier/adaptateurHorloge";

export const ConsoleAdministration = {
  forgeJeton(service: string) {
    console.log(adaptateurJWT.signeDonnees({ service }));
  },
  async revoqueJeton(service: string) {
    const serviceRevocationJeton = fabriqueServiceRevocationJeton({
      entrepotRevocationJeton: entrepotRevocationJetonPostgres,
      adaptateurHorloge,
    });
    await serviceRevocationJeton.revoquePour(service);
  },
};
