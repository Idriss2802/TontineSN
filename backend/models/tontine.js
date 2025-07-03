"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tontine extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Tontine.belongsTo(models.User, { foreignKey: "userId" });
      Tontine.belongsToMany(models.User, {
        through: models.TontineUser,
        foreignKey: "tontineId",
        as: "membres",
      });
    }
  }
  Tontine.init(
    {
      nom: DataTypes.STRING,
      description: DataTypes.TEXT,
      montant: DataTypes.DECIMAL,
      frequence: DataTypes.STRING,
      nb_max_membres: DataTypes.INTEGER,
      date_debut: DataTypes.DATE,
      userId: DataTypes.INTEGER,
      code_invitation: DataTypes.STRING, //mis a jour
    },
    {
      sequelize,
      modelName: "Tontine",
    }
  );
  return Tontine;
};
