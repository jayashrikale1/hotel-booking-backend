// models/review.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hotel_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    rating: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('PENDING','APPROVED','REJECTED'), defaultValue: 'PENDING' }
  }, { tableName: 'reviews' });

  return Review;
};
