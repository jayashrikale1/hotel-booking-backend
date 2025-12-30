'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hotels', 'ac_room_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('hotels', 'non_ac_room_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('hotels', 'ac_rooms', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('hotels', 'non_ac_rooms', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('hotels', 'check_in_time', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('hotels', 'check_out_time', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('hotels', 'cancellation_policy', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('hotels', 'gst_number', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hotels', 'ac_room_price');
    await queryInterface.removeColumn('hotels', 'non_ac_room_price');
    await queryInterface.removeColumn('hotels', 'ac_rooms');
    await queryInterface.removeColumn('hotels', 'non_ac_rooms');
    await queryInterface.removeColumn('hotels', 'check_in_time');
    await queryInterface.removeColumn('hotels', 'check_out_time');
    await queryInterface.removeColumn('hotels', 'cancellation_policy');
    await queryInterface.removeColumn('hotels', 'gst_number');
  }
};
