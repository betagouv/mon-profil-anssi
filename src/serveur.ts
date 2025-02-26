import { creeServeur } from "./api/mpa";
import { fabriqueEntrepotProfilPostgres } from "./persistance/entrepotProfil.postgres";
import { fabriqueMiddleware } from "./api/middleware";
import { adaptateurHorloge } from "./metier/adaptateurHorloge";
import { adaptateurJWT } from "./api/adaptateurJWT";
import { fabriqueServiceRevocationJeton } from "./api/serviceRevocationJeton";
import { entrepotRevocationJetonPostgres } from "./persistance/entrepotRevocationJeton.postgres";
import { fabriqueAdaptateurHachage } from "./persistance/adaptateurHachage";
import { adaptateurEnvironnement } from "./adaptateurEnvironnement";

const port = process.env.PORT || 3001;

creeServeur({
  entrepotProfil: fabriqueEntrepotProfilPostgres({
    adaptateurHachage: fabriqueAdaptateurHachage({ adaptateurEnvironnement }),
  }),
  middleware: fabriqueMiddleware({
    adaptateurJWT,
    serviceRevocationJeton: fabriqueServiceRevocationJeton({
      entrepotRevocationJeton: entrepotRevocationJetonPostgres,
      adaptateurHorloge,
    }),
  }),
  adaptateurHorloge,
}).listen(port, () => {
  console.log(`L'API MonProfilANSSI est démarrée sur le port ${port}`);
});
