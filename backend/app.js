require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt"); // Ajout pour hasher et comparer les mots de passe
const authRoutes = require("./routes/auth");
const tontineRoutes = require("./routes/tontine");

app.use(express.json());
app.use(cors()); // autorise toutes les origines
app.use("/api/auth", authRoutes);
app.use("/api/tontines", tontineRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
