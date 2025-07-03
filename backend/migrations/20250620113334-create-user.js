"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nom: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: {
            args: /^\+221\d{7,}$/,
            msg: "Le numéro de téléphone doit commencer par +221 et contenir au moins 9 chiffres au total.",
          },
        },
      },
      motdepasse: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      otp: {
        type: Sequelize.STRING,
      },
      otp_expire_at: {
        type: Sequelize.DATE,
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
