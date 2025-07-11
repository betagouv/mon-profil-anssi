import { creeServeur } from "./api/mpa";
import { fabriqueEntrepotProfilPostgres } from "./persistance/entrepotProfil.postgres";
import { fabriqueMiddleware } from "./api/middleware";
import { adaptateurHorloge } from "./metier/adaptateurHorloge";
import { adaptateurJWT } from "./api/adaptateurJWT";
import { fabriqueServiceRevocationJeton } from "./api/serviceRevocationJeton";
import { entrepotRevocationJetonPostgres } from "./persistance/entrepotRevocationJeton.postgres";
import { fabriqueAdaptateurHachage } from "./persistance/adaptateurHachage";
import { adaptateurEnvironnement } from "./adaptateurEnvironnement";
import { fabriqueAdaptateurChiffrement } from "./persistance/adaptateurChiffrement";
import { configurationServeurLabEnvironnement } from "@lab-anssi/lib";

const port = process.env.PORT || 3001;

creeServeur({
  entrepotProfil: fabriqueEntrepotProfilPostgres({
    adaptateurChiffrement: fabriqueAdaptateurChiffrement({
      adaptateurEnvironnement,
    }),
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
  serveurLab: configurationServeurLabEnvironnement(),
}).listen(port, () => {
  console.log(`L'API MonProfilANSSI est démarrée sur le port ${port}`);
});
