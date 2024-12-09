import {Profil} from "./profil.js";

export interface EntrepotProfil {
    parEmail(email: string): Profil | undefined;
}