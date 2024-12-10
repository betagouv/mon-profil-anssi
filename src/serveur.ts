import { creeServeur } from "./mpa";
import { entrepotProfilPostgres } from "./entrepotProfilPostgres";
import { fabriqueMiddleware } from "./middleware";

const port = process.env.PORT || 8080;

creeServeur({
  entrepotProfil: entrepotProfilPostgres,
  middleware: fabriqueMiddleware(),
}).listen(port, () => {
  console.log("L'API MonProfilANSSI est démarrée");
});
