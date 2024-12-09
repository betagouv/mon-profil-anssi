import { creeServeur } from "./mpa.js";
import { Profil } from "./profil.js";

const port = process.env.PORT || 8080;

const entrepotProfil = {
  parEmail(email: string): Profil | undefined {
    return undefined;
  },
};
creeServeur({ entrepotProfil }).listen(port, () => {
  console.log("L'API MonProfilANSSI est démarrée");
});
