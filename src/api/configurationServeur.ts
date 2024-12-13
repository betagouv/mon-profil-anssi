import { EntrepotProfil } from "../metier/entrepotProfil";
import { Middleware } from "./middleware";
import { AdaptateurHorloge } from "../metier/adaptateurHorloge";

export type ConfigurationServeur = {
  entrepotProfil: EntrepotProfil;
  middleware: Middleware;
  adaptateurHorloge: AdaptateurHorloge;
};
