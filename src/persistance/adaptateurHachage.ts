import { createHash } from "crypto";
import { AdaptateurEnvironnement } from "../adaptateurEnvironnement";

export const adaptateurHachage = ({
  adaptateurEnvironnement,
}: {
  adaptateurEnvironnement: AdaptateurEnvironnement;
}): AdaptateurHachage => ({
  hacheSha256: (chaineEnClair: string) => {
    const sel = adaptateurEnvironnement.hashage().sel();
    return createHash("sha256")
      .update(chaineEnClair + sel)
      .digest("hex");
  },
});

export interface AdaptateurHachage {
  hacheSha256: (chaineEnClair: string) => string;
}

export const fabriqueAdaptateurHachage = ({
  adaptateurEnvironnement,
}: {
  adaptateurEnvironnement: AdaptateurEnvironnement;
}) => adaptateurHachage({ adaptateurEnvironnement });
