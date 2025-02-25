export const adaptateurEnvironnement: AdaptateurEnvironnement = {
  hashage: () => ({
    sel: () => process.env.HASHAGE_SEL || "",
  }),
};

export interface AdaptateurEnvironnement {
  hashage: () => {
    sel: () => string;
  };
}
