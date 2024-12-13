export const adaptateurHorloge: AdaptateurHorloge = {
  maintenant: () => new Date(),
};

export interface AdaptateurHorloge {
  maintenant: () => Date;
}
