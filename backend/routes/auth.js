const express = require("express");
const router = express.Router();
const { User } = require("../models");
const {
  register,
  verifyOtp,
  login,
  profile,
} = require("../controllers/authController");
const bcrypt = require("bcrypt"); // Ajout pour hasher et comparer les mots de passe
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

router.get("/me", authMiddleware, async (req, res) => {
  const { User } = require("../models");
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "nom", "email", "telephone"],
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;
