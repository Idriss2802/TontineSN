"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Tirage extends Model {
    /**
     * Associations
     */
    static associate(models) {
      Tirage.belongsTo(models.Tontine, { foreignKey: "tontineId" });
      Tirage.belongsTo(models.User, { foreignKey: "gagnantId", as: "gagnant" });
    }
  }
  Tirage.init(
    {
      tontineId: DataTypes.INTEGER,
      gagnantId: DataTypes.INTEGER,
      montant_gagne: DataTypes.INTEGER,
      date_tirage: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Tirage",
    }
  );
  return Tirage;
};
