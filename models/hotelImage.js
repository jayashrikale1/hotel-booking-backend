// models/hotelImage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HotelImage = sequelize.define('HotelImage', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    hotel_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    is_thumbnail: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { 
    tableName: 'hotel_images',
    timestamps: true,
    underscored: true
  });

  return HotelImage;
};