const { User } = require("../models");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt"); // Ajout pour hasher et comparer les mots de passe
const jwt = require("jsonwebtoken");

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Inscription
exports.register = async (req, res) => {
  const { nom, email, telephone, motdepasse } = req.body;

  if (!nom || !email || !telephone || !motdepasse) {
    return res
      .status(400)
      .json({ message: "Nom, email, téléphone et mot de passe requis." });
  }

  try {
    let user = await User.findOne({
      where: { email },
      attributes: [
        "id",
        "nom",
        "email",
        "motdepasse",
        "telephone",
        "isVerified",
      ],
    });

    const otp = generateOTP();
    const otp_expire_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (!user) {
      const hashedPassword = await bcrypt.hash(motdepasse, 10);
      console.log("Mot de passe original :", motdepasse);
      console.log("Mot de passe haché :", hashedPassword);

      user = await User.create({
        nom,
        email,
        telephone,
        otp,
        otp_expire_at,
        isVerified: false,
        motdepasse: hashedPassword,
      });
    } else if (!user.isVerified) {
      const hashedPassword = await bcrypt.hash(motdepasse, 10);
      user.nom = nom;
      user.telephone = telephone;
      user.otp = otp;
      user.otp_expire_at = otp_expire_at;
      user.motdepasse = hashedPassword;
      await user.save();
    } else {
      return res.status(400).json({
        message: "Un compte vérifié existe déjà avec cet email.",
      });
    }

    // Envoi d’email OTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre code OTP",
      text: `Bonjour ${nom},\n\nVoici votre code OTP : ${otp}\nIl expire dans 10 minutes.`,
    });

    return res
      .status(200)
      .json({ message: "OTP envoyé à votre adresse email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Vérification OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email et code OTP requis." });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ message: "OTP incorrect." });
    }

    if (new Date() > user.otp_expire_at) {
      return res.status(401).json({ message: "OTP expiré." });
    }

    user.isVerified = true;
    user.otp = null;
    user.otp_expire_at = null;
    await user.save();

    return res.status(200).json({ message: "Compte vérifié avec succès !" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// Connexion
exports.login = async (req, res) => {
  const { email, motdepasse } = req.body;

  if (!email || !motdepasse) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "nom", "email", "motdepasse", "isVerified"],
    });

    if (!user || !user.isVerified) {
      return res
        .status(401)
        .json({ message: "Email non vérifié ou utilisateur introuvable." });
    }

    // Comparer motdepasse en clair avec le hash de la base
    const isMatch = await bcrypt.compare(motdepasse, user.motdepasse);

    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
