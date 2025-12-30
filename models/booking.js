// models/booking.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    vendor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hotel_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    room_type: { type: DataTypes.STRING, allowNull: true },
    check_in: { type: DataTypes.DATEONLY, allowNull: false },
    check_out: { type: DataTypes.DATEONLY, allowNull: false },
    guests: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    status: { type: DataTypes.ENUM('PENDING','CONFIRMED','CANCELLED'), defaultValue: 'PENDING' },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    price_per_night: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    payment_id: { type: DataTypes.STRING, allowNull: true },
    coupon_code: { type: DataTypes.STRING, allowNull: true },
    discount_amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
  }, { tableName: 'bookings' });

  return Booking;
};