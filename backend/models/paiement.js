"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Paiement extends Model {
    static associate(models) {
      Paiement.belongsTo(models.User, { foreignKey: "userId" });
      Paiement.belongsTo(models.Tontine, { foreignKey: "tontineId" });
    }
  }

  Paiement.init(
    {
      userId: DataTypes.INTEGER,
      tontineId: DataTypes.INTEGER,
      montant: DataTypes.DECIMAL,
      cycle: DataTypes.INTEGER, // ou STRING
      date_paiement: DataTypes.DATE,
      statut: DataTypes.STRING,
      operateur: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Paiement",
    }
  );

  return Paiement;
};
