"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Tontine, { foreignKey: "userId" });
      User.belongsToMany(models.Tontine, {
        through: models.TontineUser,
        foreignKey: "userId",
        as: "tontines",
      });
    }
  }
  User.init(
    {
      nom: DataTypes.STRING,
      email: DataTypes.STRING,
      telephone: DataTypes.STRING,
      motdepasse: DataTypes.STRING,
      otp: DataTypes.STRING,
      otp_expire_at: DataTypes.DATE,
      isVerified: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
