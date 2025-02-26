import { describe, it } from "node:test";
import assert from "assert";
import { adaptateurHachage } from "../../src/persistance/adaptateurHachage";

describe("L'adaptateur chiffrement", () => {
  it("peut hacher avec un sel", async () => {
    const adaptateurEnvironnement = {
      chiffrement: () => ({
        cleChaCha20Hex: () =>
          Buffer.from(
            "634d926d56f195346a23bba72128814c7b1d5a62403d080487657be6a30ad9e2",
            "hex",
          ),
      }),
      hashage: () => ({
        sel: () => "monSel",
      }),
    };

    const hache = adaptateurHachage({
      adaptateurEnvironnement,
    }).hacheSha256("7276abd6-98bb-4bc9-bd17-d50a56aba7e4");

    assert.equal(
      hache,
      "63cfe7500f258dea9fe35779cf60f4551be9979f3f36c70eb2f9a6b451e6de92",
    );
  });
});
