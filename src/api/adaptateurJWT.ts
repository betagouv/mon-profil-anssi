import { JwtPayload, verify } from "jsonwebtoken";

const secret = process.env.SECRET_JWT;

export type ContenuJeton = JwtPayload & {
  service: string;
};

export interface AdaptateurJWT {
  decode: (jeton: string) => ContenuJeton | undefined;
}

export const adaptateurJWT: AdaptateurJWT = {
  decode(jeton: string): ContenuJeton | undefined {
    if (!secret) throw new Error("SECRET_JWT non défini");

    return jeton ? (verify(jeton, secret) as ContenuJeton) : undefined;
  },
};
