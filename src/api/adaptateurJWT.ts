export type ContenuJeton = {
  service: string;
};

export interface AdaptateurJWT {
  decode: (jeton: string) => ContenuJeton | undefined;
}

export const adaptateurJWT: AdaptateurJWT = {
  decode(jeton: string): ContenuJeton | undefined {
    return undefined;
  },
};
