import { creeServeur } from "./api/mpa";
import { entrepotProfilPostgres } from "./persistance/entrepotProfil.postgres";
import { fabriqueMiddleware } from "./api/middleware";
import { adaptateurHorloge } from "./metier/adaptateurHorloge";
import { adaptateurJWT } from "./api/adaptateurJWT";
import { fabriqueServiceRevocationJeton } from "./api/serviceRevocationJeton";

const port = process.env.PORT || 3001;

creeServeur({
  entrepotProfil: entrepotProfilPostgres,
  middleware: fabriqueMiddleware({
    adaptateurJWT,
    serviceRevocationJeton: fabriqueServiceRevocationJeton(),
  }),
  adaptateurHorloge,
}).listen(port, () => {
  console.log(`L'API MonProfilANSSI est démarrée sur le port ${port}`);
});
