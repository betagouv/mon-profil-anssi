import { creeServeur } from "./mpa";
import { Profil } from "./profil";
import { fabriqueMiddleware } from "./middleware";

const port = process.env.PORT || 8080;

const entrepotProfil = {
  parEmail(email: string): Profil | undefined {
    return undefined;
  },
};
creeServeur({ entrepotProfil, middleware: fabriqueMiddleware() }).listen(
  port,
  () => {
    console.log("L'API MonProfilANSSI est démarrée");
  },
);
