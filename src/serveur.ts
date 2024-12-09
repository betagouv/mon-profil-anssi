import { creeServeur } from "./mpa.js";

const port = process.env.PORT || 8080;

creeServeur().listen(port, () => {
  console.log("L'API MonProfilANSSI est démarrée");
});
