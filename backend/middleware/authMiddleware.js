const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Le token est attendu sous la forme "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token manquant. Accès non autorisé." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // On attache les infos du token à la requête
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};

module.exports = authMiddleware;
