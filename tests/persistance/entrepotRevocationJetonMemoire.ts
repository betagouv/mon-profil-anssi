import { EntrepotRevocationJeton } from "../../src/api/entrepotRevocationJeton";
import { RevocationJeton } from "../../src/api/revocationJeton";

export class EntrepotRevocationJetonMemoire implements EntrepotRevocationJeton {
  items: RevocationJeton[] = [];

  async pourService(service: string): Promise<RevocationJeton | undefined> {
    return this.items.find((item) => item.service === service);
  }

  async ajoute(revocationJeton: RevocationJeton) {
    this.items.push(revocationJeton);
  }
}
