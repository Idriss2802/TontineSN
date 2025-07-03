"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tontines", "frequence_rappel", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1, // 1 jour par défaut
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tontines", "frequence_rappel");
  },
};
