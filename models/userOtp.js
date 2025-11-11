// models/userOtp.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserOtp = sequelize.define('UserOtp', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    channel: { type: DataTypes.ENUM('email', 'phone'), allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    code_hash: { type: DataTypes.STRING, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    consumed: { type: DataTypes.BOOLEAN, defaultValue: false },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 }
  }, {
    tableName: 'user_otps',
    timestamps: true
  });

  return UserOtp;
};