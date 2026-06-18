import {
  AdaptateurChiffrement,
  fabriqueAdaptateurChiffrement,
} from "../persistance/adaptateurChiffrement";
import { adaptateurEnvironnement } from "../adaptateurEnvironnement";
import { db } from "../persistance/knexfile";
import { decode } from "html-entities";
import { fabriqueAdaptateurHachage } from "../persistance/adaptateurHachage";

type ProfilBrut = { donnees: any; mailHash: string };

async function dechiffreProfilsBruts(
  profilBruts: any[],
  adaptateurChiffrement: AdaptateurChiffrement,
) {
  const profils: ProfilBrut[] = [];
  for (const profilBrut of profilBruts) {
    profils.push({
      donnees: await adaptateurChiffrement.dechiffre(profilBrut.donnees),
      mailHash: profilBrut.email_hash,
    });
  }
  return profils;
}

const enleveEntitesHTML = (dechiffrees: any) =>
  JSON.parse(
    JSON.stringify(dechiffrees, (_cle, valeur) =>
      typeof valeur === "string" ? decode(valeur) : valeur,
    ),
  );

export const ConsoleMigrationDecodeHtml = {
  async decodeTout() {
    const chiffrement = fabriqueAdaptateurChiffrement({
      adaptateurEnvironnement,
    });
    const hache = fabriqueAdaptateurHachage({ adaptateurEnvironnement });

    await db.transaction(async (trx) => {
      const profilBruts = await trx("profils").select();
      const profilsClairs = await dechiffreProfilsBruts(
        profilBruts,
        chiffrement,
      );

      for (let profil of profilsClairs) {
        const nouvellesDonnees = await enleveEntitesHTML(profil.donnees)
        const nouveauHash = hache.hacheSha256(nouvellesDonnees.email);
        const donneesChiffrees = await chiffrement.chiffre(nouvellesDonnees);
        console.table({ nouveauHash, ancienHash: profil.mailHash });
        await trx("profils")
          .where({ email_hash: profil.mailHash })
          .update({ donnees: donneesChiffrees, email_hash: nouveauHash });
      }
    });
  },
};
