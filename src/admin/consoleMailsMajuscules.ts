import {
  AdaptateurChiffrement,
  fabriqueAdaptateurChiffrement,
} from "../persistance/adaptateurChiffrement";
import { adaptateurEnvironnement } from "../adaptateurEnvironnement";
import { db } from "../persistance/knexfile";
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

export const ConsoleMailsMajuscules = {
  async dedoublonne() {
    let adaptateurChiffrement = fabriqueAdaptateurChiffrement({
      adaptateurEnvironnement,
    });

    const profilBruts = await db("profils").select();

    function trouveDoublons() {
      let nombreParEmail: Record<string, number> = {};
      const doublons: ProfilBrut[] = [];
      profils.forEach(function (profil) {
        const emailEnMinuscule = profil.donnees.email.toLowerCase();
        if (nombreParEmail[emailEnMinuscule] > 0) {
          doublons.push(profil);
        }
        nombreParEmail[emailEnMinuscule] =
          (nombreParEmail[emailEnMinuscule] || 0) + 1;
      });
      return doublons;
    }

    const profils = await dechiffreProfilsBruts(
      profilBruts,
      adaptateurChiffrement,
    );
    const doublons = trouveDoublons();
    console.log("Suppression de doublons : ", doublons.length);

    for (const doublon of doublons) {
      await db("inscriptions").where({ email_hash: doublon.mailHash }).del();
      await db("profils").where({ email_hash: doublon.mailHash }).del();
    }
  },
  async convertisEnMinuscule() {
    const adaptateurChiffrement = fabriqueAdaptateurChiffrement({
      adaptateurEnvironnement,
    });
    const adaptateurHachage = fabriqueAdaptateurHachage({
      adaptateurEnvironnement,
    });

    const inscriptionsChiffrees = await db("inscriptions").select();
    const inscriptions = [];
    for (const inscriptionChiffree of inscriptionsChiffrees) {
      inscriptions.push({
        donnees: await adaptateurChiffrement.dechiffre<{ email: string }>(
          inscriptionChiffree.donnees,
        ),
        mailHash: inscriptionChiffree.email_hash,
      });
    }
    for (const inscription of inscriptions) {
      if (
        inscription.donnees.email.toLowerCase() !== inscription.donnees.email
      ) {
        const nouveauHash = adaptateurHachage.hacheSha256(
          inscription.donnees.email.toLowerCase(),
        );
        let donnees = await adaptateurChiffrement.chiffre({
          email: inscription.donnees.email.toLowerCase(),
        });
        console.log(
          "Mise en minuscule de l'email de l'inscription. Nouveau hash = ",
          nouveauHash,
        );
        await db("inscriptions")
          .where({ email_hash: inscription.mailHash })
          .update({
            email_hash: nouveauHash,
            donnees,
          });
      }
    }

    const profilsChiffrees = await db("profils").select();
    const profils = await dechiffreProfilsBruts(
      profilsChiffrees,
      adaptateurChiffrement,
    );

    for (const profil of profils) {
      if (profil.donnees.email.toLowerCase() !== profil.donnees.email) {
        const nouveauHash = adaptateurHachage.hacheSha256(
          profil.donnees.email.toLowerCase(),
        );
        let donnees = await adaptateurChiffrement.chiffre({
          ...profil.donnees,
          email: profil.donnees.email.toLowerCase(),
        });
        console.log(
          "Mise en minuscule de l'email du profil. Nouveau hash = ",
          nouveauHash,
        );
        await db("profils").where({ email_hash: profil.mailHash }).update({
          email_hash: nouveauHash,
          donnees,
        });
      }
    }
  },
};
