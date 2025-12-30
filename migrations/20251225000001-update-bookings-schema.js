'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add room_type column
    await queryInterface.addColumn('bookings', 'room_type', {
      type: Sequelize.STRING,
      allowNull: true // Allow null for now, or default to something
    });

    // Make room_id nullable
    await queryInterface.changeColumn('bookings', 'room_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'room_type');
    await queryInterface.changeColumn('bookings', 'room_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false
    });
  }
};
