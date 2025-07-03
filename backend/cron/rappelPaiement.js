const cron = require("node-cron");
const { Paiement, Tontine, TontineUser, User } = require("../models");
const { transporter, sendSMS } = require("../config/sendSMS");

// Tâche planifiée : chaque jour à 9h
cron.schedule("0 9 * * *", async () => {
  console.log("🕘 Envoi des rappels de paiement prévus...");

  try {
    const tontines = await Tontine.findAll();
    const maintenant = new Date();
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(0, 0, 0, 0); // Comparaison précise à minuit

    for (const tontine of tontines) {
      const membres = await TontineUser.findAll({
        where: { tontineId: tontine.id },
        include: [User],
        order: [["position", "ASC"]],
      });

      if (!membres.length) continue;

      const dateDebut = new Date(tontine.date_debut);
      let joursParCycle = 7;
      switch ((tontine.frequence || "").toLowerCase()) {
        case "quotidienne":
          joursParCycle = 1;
          break;
        case "bimensuelle":
          joursParCycle = 14;
          break;
        case "mensuelle":
          joursParCycle = 30;
          break;
        default:
          joursParCycle = 7;
      }

      const totalMembres = membres.length;

      // Générer les prochains 12 cycles (suffisant pour anticiper demain)
      for (let n = 0; n < 12; n++) {
        for (let i = 0; i < membres.length; i++) {
          const cycle = n * totalMembres + (i + 1);
          const membre = membres[i];
          const user = membre.User;

          const datePaiement = new Date(dateDebut);
          datePaiement.setDate(
            datePaiement.getDate() + joursParCycle * (cycle - 1)
          );
          datePaiement.setHours(0, 0, 0, 0);

          if (datePaiement.getTime() === demain.getTime()) {
            const paiementExiste = await Paiement.findOne({
              where: {
                tontineId: tontine.id,
                userId: user.id,
                cycle,
              },
            });

            if (!paiementExiste) {
              const message = `Bonjour ${user.nom},\nDemain vous devez effectuer votre paiement pour la tontine "${tontine.nom}". Montant : ${tontine.montant} FCFA (Cycle ${cycle}).`;

              // Email
              if (user.email) {
                await transporter.sendMail({
                  from: `"TontineApp" <${process.env.EMAIL_USER}>`,
                  to: user.email,
                  subject: `💰 Rappel : paiement prévu demain`,
                  text: message,
                });
              }

              // SMS
              if (user.telephone) {
                await sendSMS(user.telephone, message);
              }

              console.log(`📨 Rappel envoyé à ${user.nom} (cycle ${cycle})`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur dans le script de rappels :", error);
  }
});
