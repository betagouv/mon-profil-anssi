import { adaptateurJWT } from "./api/adaptateurJWT";

export const ConsoleAdministration = {
  forgeJeton(service: string) {
    console.log(adaptateurJWT.signeDonnees({ service }));
  },
};
