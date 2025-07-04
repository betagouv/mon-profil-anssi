import { EntrepotProfil } from "../metier/entrepotProfil";
import { Middleware } from "./middleware";
import { AdaptateurHorloge } from "../metier/adaptateurHorloge";
import { ConfigurationServeurLab } from "@lab-anssi/lib";

export type ConfigurationServeur = {
  entrepotProfil: EntrepotProfil;
  middleware: Middleware;
  adaptateurHorloge: AdaptateurHorloge;
  serveurLab: ConfigurationServeurLab;
};
