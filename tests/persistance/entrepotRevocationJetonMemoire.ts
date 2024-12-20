import {
  EntrepotRevocationJeton,
  RevocationJeton,
} from "../../src/api/serviceRevocationJeton";

export class EntrepotRevocationJetonMemoire implements EntrepotRevocationJeton {
  items: RevocationJeton[] = [];

  async pourService(service: string): Promise<RevocationJeton | undefined> {
    return this.items.find((item) => item.service === service);
  }

  async ajoute(revocationJeton: RevocationJeton) {
    this.items.push(revocationJeton);
  }
}
