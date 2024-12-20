import { RevocationJeton } from "./revocationJeton";

export interface EntrepotRevocationJeton {
  ajoute(revocationJeton: RevocationJeton): Promise<void>;
  pourService(service: string): Promise<RevocationJeton | undefined>;
}
