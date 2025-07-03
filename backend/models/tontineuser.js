"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TontineUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TontineUser.belongsTo(models.User, { foreignKey: "userId" });
      TontineUser.belongsTo(models.Tontine, { foreignKey: "tontineId" });
    }
  }
  TontineUser.init(
    {
      userId: DataTypes.INTEGER,
      tontineId: DataTypes.INTEGER,
      position: DataTypes.INTEGER,
      isAdmin: DataTypes.BOOLEAN,
      statut: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "TontineUser",
    }
  );
  return TontineUser;
};
