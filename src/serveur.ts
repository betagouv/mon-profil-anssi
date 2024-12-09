import { creeServeur } from "./mpa";
import { Profil } from "./profil";

const port = process.env.PORT || 8080;

const entrepotProfil = {
  parEmail(email: string): Profil | undefined {
    return undefined;
  },
};
creeServeur({ entrepotProfil }).listen(port, () => {
  console.log("L'API MonProfilANSSI est démarrée");
});
