const express = require("express");
const router = express.Router();
const { Tontine, TontineUser } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

// Route pour créer une tontine
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { nom, description, montant, frequence, nb_max_membres, date_debut } =
      req.body;

    // Générer un code d’invitation unique (6 caractères alphanumériques en majuscules)
    const code_invitation = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const nouvelleTontine = await Tontine.create({
      nom,
      description,
      montant,
      frequence,
      nb_max_membres,
      date_debut,
      userId: req.user.id,
      code_invitation,
    });

    // Ajouter le créateur comme membre admin
    await TontineUser.create({
      userId: req.user.id,
      tontineId: nouvelleTontine.id,
      position: 1,
      isAdmin: true,
      code_invitation: code_invitation,
      statut: "actif",
    });

    res.status(201).json({
      message: "Tontine créée avec succès",
      tontine: nouvelleTontine,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la tontine:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Liste des tontines de l'utilisateur connecté
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tontines = await Tontine.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({ tontines });
  } catch (error) {
    console.error("Erreur lors de la récupération des tontines:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Ajouter un membre dans une tontine (le créateur est admin)
router.post("/:tontineId/membres", authMiddleware, async (req, res) => {
  const { email, position } = req.body;
  const { tontineId } = req.params;
  const { User, TontineUser, Tontine } = require("../models");

  try {
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine || tontine.userId !== req.user.id) {
      return res.status(403).json({
        message: "Vous n'avez pas le droit de modifier cette tontine.",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    const membre = await TontineUser.create({
      userId: user.id,
      tontineId,
      position,
      isAdmin: false,
      statut: "invité",
    });

    res.status(201).json({ message: "Membre ajouté à la tontine.", membre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Rejoindre une tontine
router.post("/:id/join", async (req, res) => {
  const tontineId = req.params.id;
  const { userId, position, isAdmin } = req.body;

  try {
    // Vérifier que la tontine existe
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine)
      return res.status(404).json({ message: "Tontine non trouvée." });

    // Vérifier que l'utilisateur n'est pas déjà membre
    const exist = await TontineUser.findOne({ where: { userId, tontineId } });
    if (exist)
      return res
        .status(400)
        .json({ message: "Utilisateur déjà membre de la tontine." });

    // Ajouter l'utilisateur
    const membre = await TontineUser.create({
      userId,
      tontineId,
      position: position || null,
      isAdmin: isAdmin || false,
      statut: "actif",
    });

    res
      .status(201)
      .json({ message: "Utilisateur ajouté à la tontine", membre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// retourne tous les membres d’une tontine donnée

router.get("/:id/membres", async (req, res) => {
  const tontineId = req.params.id;
  const { User, TontineUser, Tontine } = require("../models");

  try {
    const membres = await TontineUser.findAll({
      where: { tontineId },
      include: [
        {
          model: User,
          attributes: ["id", "nom", "email"],
        },
      ],
      attributes: ["position", "isAdmin", "statut"],
    });

    res.status(200).json(membres);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération des membres." });
  }
});

// supprimer membre d'une tontine
router.delete(
  "/:tontineId/membres/:userId",
  authMiddleware,
  async (req, res) => {
    const { tontineId, userId } = req.params;
    const { User, TontineUser, Tontine } = require("../models");

    try {
      const tontine = await Tontine.findByPk(tontineId);

      if (!tontine || tontine.userId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Accès refusé. Admin uniquement." });
      }

      // Ne pas permettre à l'admin de se retirer lui-même
      if (parseInt(userId) === req.user.id) {
        return res
          .status(400)
          .json({ message: "Vous ne pouvez pas vous supprimer vous-même." });
      }

      const membre = await TontineUser.findOne({
        where: { tontineId, userId },
      });

      if (!membre) {
        return res
          .status(404)
          .json({ message: "Membre non trouvé dans cette tontine." });
      }

      await membre.destroy();

      res.json({ message: "Membre supprimé avec succès." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// Déléguer l'administration à un autre membre
router.post("/:tontineId/deleguer-admin", authMiddleware, async (req, res) => {
  const { tontineId } = req.params;
  const { nouveauAdminId } = req.body;
  const userId = req.user.id;

  const { TontineUser } = require("../models");

  try {
    // Vérifier que l'utilisateur actuel est bien admin
    const admin = await TontineUser.findOne({
      where: { tontineId, userId },
    });

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({
        message: "Seul l'administrateur peut déléguer l'administration.",
      });
    }

    // Vérifier que le nouveau admin est bien membre
    const nouveauAdmin = await TontineUser.findOne({
      where: { tontineId, userId: nouveauAdminId },
    });

    if (!nouveauAdmin) {
      return res.status(404).json({
        message: "Le nouveau membre désigné n'est pas dans la tontine.",
      });
    }

    // Mise à jour des rôles dans TontineUser
    admin.isAdmin = false;
    await admin.save();

    nouveauAdmin.isAdmin = true;
    await nouveauAdmin.save();

    // Pour mettre à jour aussi le userId dans la table Tontines
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }
    tontine.userId = nouveauAdminId;
    await tontine.save();

    res.json({ message: "L'administration a été transférée avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Quitter une tontine (membre non-admin) + notifier l’admin par email
router.delete("/:tontineId/quitter", authMiddleware, async (req, res) => {
  const { tontineId } = req.params;
  const { Tontine, TontineUser, User } = require("../models");
  const transporter = require("../config/mailer");

  try {
    const tontine = await Tontine.findByPk(tontineId);

    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }

    // L'admin ne peut pas quitter sans déléguer
    if (tontine.userId === req.user.id) {
      return res.status(403).json({
        message:
          "L'administrateur ne peut pas quitter la tontine sans déléguer l'administration.",
      });
    }

    const membre = await TontineUser.findOne({
      where: {
        tontineId,
        userId: req.user.id,
      },
    });

    if (!membre) {
      return res
        .status(404)
        .json({ message: "Vous n'êtes pas membre de cette tontine." });
    }

    await membre.destroy();

    // Récupération de l'admin de la tontine
    const adminUser = await User.findByPk(tontine.userId);
    const quittingUser = await User.findByPk(req.user.id);

    // Envoi de l'email
    if (adminUser && adminUser.email) {
      await transporter.sendMail({
        from: `"TontineApp" <${process.env.EMAIL_USER}>`,
        to: adminUser.email,
        subject: "Un membre a quitté votre tontine",
        html: `
          <p>Bonjour ${adminUser.nom},</p>
          <p>Le membre <strong>${quittingUser.nom}</strong> (${quittingUser.email}) a quitté la tontine <strong>${tontine.nom}</strong>.</p>
          <p>Connectez-vous pour voir les membres restants.</p>
        `,
      });
    }

    res.json({
      message: "Vous avez quitté la tontine. L’administrateur a été notifié.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Modifier une tontine (réservée à l’admin)
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nom, description, montant, frequence, nb_max_membres, date_debut } =
    req.body;

  const { Tontine } = require("../models");

  try {
    const tontine = await Tontine.findByPk(id);

    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }

    if (tontine.userId !== req.user.id) {
      return res.status(403).json({
        message:
          "Accès refusé. Seul l'administrateur peut modifier cette tontine.",
      });
    }

    tontine.nom = nom ?? tontine.nom;
    tontine.description = description ?? tontine.description;
    tontine.montant = montant ?? tontine.montant;
    tontine.frequence = frequence ?? tontine.frequence;
    tontine.nb_max_membres = nb_max_membres ?? tontine.nb_max_membres;
    tontine.date_debut = date_debut ?? tontine.date_debut;

    await tontine.save();

    res.json({ message: "Tontine mise à jour avec succès.", tontine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// suppression d’une tontine (réservée par l'administrateur:createur)
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { Tontine, TontineUser } = require("../models");

  try {
    const tontine = await Tontine.findByPk(id);

    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }

    if (tontine.userId !== req.user.id) {
      return res.status(403).json({
        message: "Seul l'administrateur peut supprimer cette tontine.",
      });
    }

    // Supprimer les relations d'abord (si cascade non activée)
    await TontineUser.destroy({ where: { tontineId: id } });

    // Supprimer la tontine
    await tontine.destroy();

    res.json({ message: "Tontine supprimée avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Rejoindre une tontine via un code d’invitation
router.post("/rejoindre", authMiddleware, async (req, res) => {
  const { code_invitation } = req.body;
  const { Tontine, TontineUser } = require("../models");

  try {
    const tontine = await Tontine.findOne({ where: { code_invitation } });

    if (!tontine) {
      return res.status(404).json({ message: "Code d'invitation invalide." });
    }

    const dejaMembre = await TontineUser.findOne({
      where: { tontineId: tontine.id, userId: req.user.id },
    });

    if (dejaMembre) {
      return res
        .status(400)
        .json({ message: "Vous êtes déjà membre de cette tontine." });
    }

    const maxPosition = await TontineUser.max("position", {
      where: { tontineId: tontine.id },
    });

    const nouvellePosition = isNaN(maxPosition) ? 1 : maxPosition + 1;

    await TontineUser.create({
      userId: req.user.id,
      tontineId: tontine.id,
      position: nouvellePosition,
      isAdmin: false,
      statut: "actif",
    });

    res
      .status(201)
      .json({ message: "Vous avez rejoint la tontine avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Voir toutes les tontines auxquelles un utilisateur participe
router.get("/mes-tontines", authMiddleware, async (req, res) => {
  const { TontineUser, Tontine } = require("../models");

  try {
    const participations = await TontineUser.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Tontine,
          attributes: ["id", "nom", "description", "montant", "frequence"],
        },
      ],
    });

    const tontines = participations.map((p) => ({
      id: p.Tontine.id,
      nom: p.Tontine.nom,
      description: p.Tontine.description,
      montant: p.Tontine.montant,
      frequence: p.Tontine.frequence,
      position: p.position,
      isAdmin: p.isAdmin,
      statut: p.statut,
    }));

    res.json(tontines);
  } catch (error) {
    console.error("Erreur lors de la récupération des tontines :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST Un membre effectue un paiement
router.post("/:id/paiement", authMiddleware, async (req, res) => {
  const { id: tontineId } = req.params;
  const { Paiement, TontineUser, Tontine, User } = require("../models");
  const { montant, operateur } = req.body;
  const transporter = require("../config/mailer");
  //const sendSMS = require("../config/sendSMS");

  try {
    // Vérifie que la tontine existe
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }

    // Vérifie que l'utilisateur est membre
    const membre = await TontineUser.findOne({
      where: { tontineId, userId: req.user.id },
    });
    if (!membre) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas membre de cette tontine." });
    }

    // Vérifie le montant
    const montantEnvoye = Number(montant);
    const montantAttendu = Number(tontine.montant);
    if (montantEnvoye !== montantAttendu) {
      return res.status(400).json({
        message: `Montant incorrect. Le montant attendu est ${montantAttendu}.`,
      });
    }

    // Vérifie l'opérateur
    const operateursDisponibles = ["Orange Money", "Wave", "Wizall"];
    if (!operateur || !operateursDisponibles.includes(operateur)) {
      return res.status(400).json({
        message: "Opérateur de paiement invalide ou manquant.",
        operateurs_autorises: operateursDisponibles,
      });
    }

    // Détermination automatique du cycle selon la fréquence
    const dateDebut = new Date(tontine.date_debut);
    const maintenant = new Date();
    const diffMs = maintenant - dateDebut;
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let joursParCycle = 7; // valeur par défaut (hebdomadaire)
    switch ((tontine.frequence || "").toLowerCase()) {
      case "quotidienne":
        joursParCycle = 1;
        break;
      case "hebdomadaire":
        joursParCycle = 7;
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

    const cycle = Math.floor(diffJours / joursParCycle) + 1;

    // Empêche un double paiement pour ce cycle
    const dejaPaye = await Paiement.findOne({
      where: {
        userId: req.user.id,
        tontineId: tontine.id,
        cycle,
      },
    });
    if (dejaPaye) {
      return res.status(400).json({
        message: `Vous avez déjà effectué le paiement du cycle ${cycle}.`,
      });
    }

    // Création du paiement
    const paiement = await Paiement.create({
      userId: req.user.id,
      tontineId: tontine.id,
      montant: montantAttendu,
      cycle,
      date_paiement: new Date(),
      statut: "effectué",
      operateur,
    });

    // 🔔 Notification email + SMS
    const user = await User.findByPk(req.user.id);

    // Email
    await transporter.sendMail({
      from: `"TontineApp" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Paiement reçu - Tontine ${tontine.nom}`,
      text: `Bonjour ${user.nom},\n\nVotre paiement de ${tontine.montant} FCFA via ${operateur} pour la tontine "${tontine.nom}" a bien été enregistré (cycle ${cycle}).\n\nMerci.`,
    });

    // SMS
    // await sendSMS({
    //   to: user.telephone,
    //   message: `Paiement de ${tontine.montant} FCFA reçu pour "${tontine.nom}" (Cycle ${cycle}) via ${operateur}.`,
    // });

    res.status(201).json({
      message: "Paiement enregistré.",
      paiement,
    });
  } catch (error) {
    console.error("Erreur lors du paiement :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET Voir les paiements d'une tontine (admin uniquement)
router.get("/:id/paiements", authMiddleware, async (req, res) => {
  const { id: tontineId } = req.params;
  const { Paiement, Tontine, User } = require("../models");

  try {
    // Vérifie que l'utilisateur est admin de la tontine
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine || tontine.userId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const paiements = await Paiement.findAll({
      where: { tontineId },
      include: [{ model: User, attributes: ["id", "nom", "email"] }],
      order: [["date_paiement", "DESC"]],
    });

    res.json({ paiements });
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET Historique de mes paiements
router.get("/mes-paiements", authMiddleware, async (req, res) => {
  const { Paiement, Tontine } = require("../models");

  try {
    const paiements = await Paiement.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Tontine,
          attributes: ["nom", "montant"],
        },
      ],
      order: [["date_paiement", "DESC"]],
    });

    res.json({
      paiements: paiements.map((p) => ({
        tontine: p.Tontine,
        montant: p.montant,
        cycle: p.cycle,
        operateur: p.operateur,
        date_paiement: p.date_paiement,
        statut: p.statut,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET agenda de la tontine
router.get("/:id/agenda", authMiddleware, async (req, res) => {
  const { id: tontineId } = req.params;
  const { Tontine, TontineUser, Paiement, User } = require("../models");

  try {
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine) {
      return res.status(404).json({ message: "Tontine non trouvée." });
    }

    const membres = await TontineUser.findAll({
      where: { tontineId },
      include: [{ model: User, attributes: ["id", "nom", "email"] }],
      order: [["position", "ASC"]],
    });

    if (!membres.length) {
      return res.json({ agenda: [] });
    }

    const totalMembres = membres.length;
    const cyclesGeneres = 12; // on génère 12 cycles
    const dateDebut = new Date(tontine.date_debut);
    const frequence = (tontine.frequence || "").toLowerCase();

    let joursParCycle = 7;
    switch (frequence) {
      case "quotidienne":
        joursParCycle = 1;
        break;
      case "hebdomadaire":
        joursParCycle = 7;
        break;
      case "bimensuelle":
        joursParCycle = 14;
        break;
      case "mensuelle":
        joursParCycle = 30;
        break;
    }

    // Tirage : tous les 3 mois (90 jours), sauf "mensuelle" → 180 jours
    const joursEntreTirages = frequence === "mensuelle" ? 180 : 90;

    const paiementsExistants = await Paiement.findAll({
      where: { tontineId },
    });

    const agenda = [];

    for (let n = 0; n < cyclesGeneres; n++) {
      for (let i = 0; i < totalMembres; i++) {
        const membre = membres[i];
        const cycle = n * totalMembres + (i + 1);

        const joursDepuisDebut = (cycle - 1) * joursParCycle;
        const datePaiement = new Date(dateDebut);
        datePaiement.setDate(datePaiement.getDate() + joursDepuisDebut);

        const estJourDeTirage =
          Math.floor(joursDepuisDebut / joursEntreTirages) !==
          Math.floor((joursDepuisDebut - joursParCycle) / joursEntreTirages);

        const paiementEffectue = paiementsExistants.find(
          (p) =>
            p.userId === membre.userId &&
            p.tontineId === tontine.id &&
            p.cycle === cycle
        );

        let statut = "à venir";
        const aujourdHui = new Date();
        if (paiementEffectue) {
          statut = "effectué";
        } else if (datePaiement < aujourdHui) {
          statut = "en retard";
        } else if (datePaiement.toDateString() === aujourdHui.toDateString()) {
          statut = "en cours";
        }

        agenda.push({
          cycle,
          date_paiement: datePaiement.toISOString().split("T")[0],
          membre: {
            id: membre.User.id,
            nom: membre.User.nom,
            email: membre.User.email,
          },
          statut,
          estJourDeTirage,
        });
      }
    }

    res.json({ agenda });
  } catch (error) {
    console.error("Erreur génération agenda :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET historique des tirages d'une tontine (admin uniquement)
router.get("/:id/tirages", authMiddleware, async (req, res) => {
  const { Tirage, Tontine, User } = require("../models");
  const tontineId = req.params.id;

  try {
    const tontine = await Tontine.findByPk(tontineId);
    if (!tontine || tontine.userId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const tirages = await Tirage.findAll({
      where: { tontineId },
      include: [
        { model: User, as: "gagnant", attributes: ["id", "nom", "email"] },
      ],
      order: [["date_tirage", "DESC"]],
    });

    res.json({ tirages });
  } catch (error) {
    console.error("Erreur récupération tirages:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Effectuer tirage manuel tournant
router.post("/:tontineId/effectTirage", authMiddleware, async (req, res) => {
  const { tontineId } = req.params;
  const userId = req.user.id;
  const { Tontine, TontineUser, Tirage } = require("../models");

  try {
    // Vérifier si l'utilisateur est admin
    const admin = await TontineUser.findOne({
      where: { tontineId, userId, isAdmin: true },
    });

    if (!admin) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas administrateur." });
    }

    // Récupérer les membres actifs triés par position
    const membres = await TontineUser.findAll({
      where: { tontineId, statut: "actif" },
      order: [["position", "ASC"]],
    });

    if (membres.length === 0) {
      return res.status(400).json({ message: "Aucun membre actif." });
    }

    // Récupérer tous les tirages précédents
    const tiragesPrecedents = await Tirage.findAll({
      where: { tontineId },
      order: [["date_tirage", "ASC"]],
    });

    // Déterminer la liste des userId déjà gagnants
    const dejaGagnants = tiragesPrecedents.map((t) => t.gagnantId);

    // Chercher le premier membre qui n'a pas encore gagné
    const prochainGagnant = membres.find(
      (m) => !dejaGagnants.includes(m.userId)
    );

    // Si tous ont gagné, recommencer le cycle
    const gagnant = prochainGagnant || membres[0];

    // Créer le tirage
    const tirage = await Tirage.create({
      tontineId,
      gagnantId: gagnant.userId,
      montant_gagne: 100000, // à adapter
      date_tirage: new Date(),
    });

    res.json({
      message: "Tirage effectué avec succès.",
      gagnantId: gagnant.userId,
      tirageId: tirage.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
