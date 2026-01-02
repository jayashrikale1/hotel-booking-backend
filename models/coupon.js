// models/coupon.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('FLAT', 'PERCENT'), defaultValue: 'FLAT' },
    value: { type: DataTypes.FLOAT, allowNull: false },
    expiry: { type: DataTypes.DATE, allowNull: true },
    usage_limit: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    used_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'coupons' });

  return Coupon;
};