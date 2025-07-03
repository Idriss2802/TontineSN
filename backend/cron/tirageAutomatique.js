require("dotenv").config();
const { Tontine, TontineUser, Tirage, User } = require("../models");
const transporter = require("../config/mailer");

(async () => {
  console.log("🎲 Début du tirage automatique...");

  const maintenant = new Date();

  try {
    const tontines = await Tontine.findAll();

    for (const tontine of tontines) {
      let moisTirage = 3;
      if ((tontine.frequence || "").toLowerCase() === "mensuelle") {
        moisTirage = 6;
      }

      // Dernier tirage
      const dernierTirage = await Tirage.findOne({
        where: { tontineId: tontine.id },
        order: [["date_tirage", "DESC"]],
      });

      let prochaineDateTirage;
      if (dernierTirage) {
        prochaineDateTirage = new Date(dernierTirage.date_tirage);
        prochaineDateTirage.setMonth(
          prochaineDateTirage.getMonth() + moisTirage
        );
      } else {
        prochaineDateTirage = new Date(tontine.date_debut);
        prochaineDateTirage.setMonth(
          prochaineDateTirage.getMonth() + moisTirage
        );
      }

      const diffMs = maintenant - prochaineDateTirage;

      if (diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000) {
        console.log(`🎯 Tirage à effectuer pour "${tontine.nom}"`);

        // Membres actifs
        const membres = await TontineUser.findAll({
          where: { tontineId: tontine.id, statut: "actif" },
          include: [{ model: User }],
        });

        if (membres.length === 0) {
          console.log(`Aucun membre actif pour "${tontine.nom}".`);
          continue;
        }

        // Choisir un gagnant aléatoire
        const gagnantIndex = Math.floor(Math.random() * membres.length);
        const gagnant = membres[gagnantIndex];

        // Calcul du montant gagné
        const montantGagne = tontine.montant * membres.length;

        // Créer le tirage
        await Tirage.create({
          tontineId: tontine.id,
          gagnantId: gagnant.userId,
          montant_gagne: montantGagne,
          date_tirage: prochaineDateTirage,
        });

        // Email gagnant
        if (gagnant.User.email) {
          await transporter.sendMail({
            from: `"TontineApp" <${process.env.EMAIL_USER}>`,
            to: gagnant.User.email,
            subject: `🎉 Vous avez gagné le tirage de la tontine "${tontine.nom}"`,
            html: `
              <p>Bonjour ${gagnant.User.nom},</p>
              <p>Félicitations ! Vous êtes le gagnant du tirage de la tontine <strong>${
                tontine.nom
              }</strong> du ${prochaineDateTirage.toLocaleDateString()}.</p>
              <p>Montant gagné : <strong>${montantGagne} FCFA</strong>.</p>
              <p>Merci de votre participation !</p>
            `,
          });
        }

        console.log(`🏆 Gagnant: ${gagnant.User.nom} (${gagnant.User.email})`);
      } else {
        console.log(
          `⏳ Pas de tirage prévu aujourd'hui pour "${tontine.nom}".`
        );
      }
    }

    console.log("✅ Tirage automatique terminé.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur tirage automatique :", error);
    process.exit(1);
  }
})();
