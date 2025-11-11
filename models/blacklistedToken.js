const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BlacklistedToken extends Model {}

  BlacklistedToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'BlacklistedToken',
    tableName: 'blacklisted_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No need for an updatedAt field
  });

  return BlacklistedToken;
};