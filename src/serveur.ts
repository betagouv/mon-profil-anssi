import { creeServeur } from "./api/mpa";
import { entrepotProfilPostgres } from "./persistance/entrepotProfil.postgres";
import { fabriqueMiddleware } from "./api/middleware";

const port = process.env.PORT || 3001;

creeServeur({
  entrepotProfil: entrepotProfilPostgres,
  middleware: fabriqueMiddleware(),
}).listen(port, () => {
  console.log(`L'API MonProfilANSSI est démarrée sur le port ${port}`);
});
