export const adaptateurEnvironnement: AdaptateurEnvironnement = {
  chiffrement: () => ({
    cleChaCha20Hex: () =>
      Buffer.from(process.env.CHIFFREMENT_CHACHA20_CLE_HEX || "", "hex"),
  }),
  hashage: () => ({
    sel: () => process.env.HASHAGE_SEL || "",
  }),
};

export interface AdaptateurEnvironnement {
  chiffrement: () => {
    cleChaCha20Hex: () => Buffer<ArrayBufferLike>;
  };
  hashage: () => {
    sel: () => string;
  };
}
