export class ErreurDonneesObligatoiresManquantes implements Error {
    message: string;
    name: string = "ErreurDonneesObligatoiresManquantes";

    constructor(champ: string) {
        this.message = `Le champ [${champ}] est obligatoire`;
    }
}