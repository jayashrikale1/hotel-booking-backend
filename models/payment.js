// models/payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    gateway: { type: DataTypes.STRING, allowNull: false },
    gateway_payment_id: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    status: { type: DataTypes.ENUM('INITIATED','SUCCESS','FAILED'), defaultValue: 'INITIATED' }
  }, { tableName: 'payments' });

  return Payment;
};
