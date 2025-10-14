// models/hotel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Hotel = sequelize.define('Hotel', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    vendor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    latitude: { type: DataTypes.DECIMAL(10,7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10,7), allowNull: true },
    amenities: { type: DataTypes.JSON, allowNull: true }, // array/object
    phone: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true },
    rating: { type: DataTypes.DECIMAL(2,1), defaultValue: 0.0 },
    total_rooms: { type: DataTypes.INTEGER, defaultValue: 0 },
    available_rooms: { type: DataTypes.INTEGER, defaultValue: 0 },
    base_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
    status: { type: DataTypes.ENUM('PENDING','APPROVED','REJECTED','INACTIVE'), defaultValue: 'PENDING' },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'hotels',
    timestamps: true,
    underscored: true
  });

  return Hotel;
};