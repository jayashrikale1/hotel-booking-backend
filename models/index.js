// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = require('./admin')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const Vendor = require('./vendor')(sequelize, DataTypes);
const Hotel = require('./hotel')(sequelize, DataTypes);
const HotelImage = require('./hotelImage')(sequelize, DataTypes);
const Room = require('./room')(sequelize, DataTypes);
const Booking = require('./booking')(sequelize, DataTypes);
const Review = require('./review')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);
const Coupon = require('./coupon')(sequelize, DataTypes);
const UserOtp = require('./userOtp')(sequelize, DataTypes);
const BlacklistedToken = require('./blacklistedToken')(sequelize, DataTypes);

// Associations
// Vendor-Hotel relationship (vendors own hotels)
Vendor.hasMany(Hotel, { foreignKey: 'vendor_id', as: 'hotels' });
Hotel.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Removed: Association based on approved_by (column removed)

// Hotel-HotelImage relationship
Hotel.hasMany(HotelImage, { foreignKey: 'hotel_id', as: 'images' });
HotelImage.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// Hotel-Room relationship
Hotel.hasMany(Room, { foreignKey: 'hotel_id', as: 'rooms' });
Room.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// User-Booking relationship
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Vendor-Booking relationship
Vendor.hasMany(Booking, { foreignKey: 'vendor_id', as: 'bookings' });
Booking.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Hotel-Booking relationship
Hotel.hasMany(Booking, { foreignKey: 'hotel_id', as: 'bookings' });
Booking.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// Room-Booking relationship
Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// User-Review relationship
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User-OTP relationship
User.hasMany(UserOtp, { foreignKey: 'user_id', as: 'otps' });
UserOtp.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Hotel-Review relationship
Hotel.hasMany(Review, { foreignKey: 'hotel_id', as: 'reviews' });
Review.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// Booking-Payment relationship
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Export
module.exports = {
  sequelize,
  Sequelize,
  Admin,
  User,
  Vendor,
  Hotel,
  HotelImage,
  Room,
  Booking,
  Review,
  Payment,
  Coupon,
  UserOtp,
  BlacklistedToken
};
