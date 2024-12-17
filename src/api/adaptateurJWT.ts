const jwt = require("jsonwebtoken");

const secret = process.env.SECRET_JWT;

export type ContenuJeton = {
  service: string;
};

export interface AdaptateurJWT {
  decode: (jeton: string) => ContenuJeton | undefined;
}

export const adaptateurJWT: AdaptateurJWT = {
  decode(jeton: string): ContenuJeton | undefined {
    return jeton ? jwt.verify(jeton, secret) : undefined;
  },
};
