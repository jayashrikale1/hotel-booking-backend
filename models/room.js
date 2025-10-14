// models/room.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Room = sequelize.define('Room', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    hotel_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // Deluxe, Suite...
    price: { type: DataTypes.FLOAT, allowNull: false },
    total_rooms: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    available_rooms: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    amenities: { type: DataTypes.TEXT, allowNull: true } // JSON
  }, { tableName: 'rooms' });

  return Room;
};
