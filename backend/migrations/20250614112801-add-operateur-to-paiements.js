"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Paiements", "operateur", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Inconnu",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Paiements", "operateur");
  },
};
