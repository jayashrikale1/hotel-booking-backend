module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'coupon_code', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('bookings', 'discount_amount', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'coupon_code');
    await queryInterface.removeColumn('bookings', 'discount_amount');
  }
};