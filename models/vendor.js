// models/vendor.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },
    business_name: { type: DataTypes.STRING, allowNull: true },
    business_address: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('PENDING', 'ACTIVE', 'SUSPENDED'), defaultValue: 'PENDING' }
  }, {
    tableName: 'vendors',
    timestamps: true
  });

  return Vendor;
};
