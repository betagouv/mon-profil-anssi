import { EntrepotProfil } from "../metier/entrepotProfil";
import { Middleware } from "./middleware";

export type ConfigurationServeur = {
  entrepotProfil: EntrepotProfil;
  middleware: Middleware;
};
