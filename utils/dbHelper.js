/**
 * Database Helper Utility
 * Provides common database operations and query builders
 */

const { Op } = require('sequelize');

/**
 * Build search conditions for hotels
 * @param {Object} query - Query parameters
 * @returns {Object} - Sequelize where conditions
 */
const buildHotelSearchConditions = (query) => {
  const { city, destination, name, status = 'APPROVED', minPrice, maxPrice } = query;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (city) {
    where.city = { [Op.like]: `%${city}%` };
  }

  if (name) {
    where.name = { [Op.like]: `%${name}%` };
  }

  const andConditions = [];

  if (destination) {
    andConditions.push({
      [Op.or]: [
        { city: { [Op.like]: `%${destination}%` } },
        { name: { [Op.like]: `%${destination}%` } },
        { address: { [Op.like]: `%${destination}%` } }
      ]
    });
  }

  if (minPrice || maxPrice) {
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_VALUE;
    andConditions.push({
      [Op.or]: [
        {
          ac_room_price: {
            [Op.and]: [{ [Op.gte]: min }, { [Op.lte]: max }]
          }
        },
        {
          non_ac_room_price: {
            [Op.and]: [{ [Op.gte]: min }, { [Op.lte]: max }]
          }
        }
      ]
    });
  }

  if (andConditions.length > 0) {
    where[Op.and] = andConditions;
  }

  return where;
};

/**
 * Build price filter conditions for rooms
 * @param {Object} query - Query parameters
 * @returns {Object} - Sequelize where conditions
 */
const buildRoomPriceConditions = (query) => {
  const { minPrice, maxPrice, guests } = query;
  const where = {};

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && { [Op.gte]: parseFloat(minPrice) }),
      ...(maxPrice && { [Op.lte]: parseFloat(maxPrice) })
    };
  }

  if (guests) {
    where.available_rooms = { [Op.gte]: 1 };
  }

  return where;
};

/**
 * Standard hotel include options for queries
 */
const getHotelIncludes = () => [
  { model: require('../models').HotelImage, as: 'images' },
  // { model: require('../models').Room, as: 'rooms' },
  { model: require('../models').Vendor, as: 'vendor', attributes: ['id', 'full_name', 'business_name'] }
];

/**
 * Standard booking include options for queries
 */
const getBookingIncludes = () => [
  { model: require('../models').User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone'] },
  { 
    model: require('../models').Hotel, 
    as: 'hotel', 
    attributes: ['id', 'name', 'address', 'city', 'state', 'phone', 'email'],
    include: [{ model: require('../models').HotelImage, as: 'images', limit: 1, attributes: ['url'] }]
  },
  { model: require('../models').Room, as: 'room', attributes: ['id', 'type', 'price'] },
  { model: require('../models').Payment, as: 'payment' }
];

/**
 * Calculate booking amount
 * @param {number} roomPrice - Price per night
 * @param {string} checkIn - Check-in date
 * @param {string} checkOut - Check-out date
 * @returns {Object} - { amount: number, nights: number }
 */
const calculateBookingAmount = (roomPrice, checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const amount = roomPrice * nights;

  return { amount, nights };
};

/**
 * Check if user owns resource (hotel/room/booking)
 * @param {Object} resource - Database resource
 * @param {number} userId - User ID to check
 * @param {string} ownerField - Field name for owner (default: 'vendor_id')
 * @returns {boolean} - True if user owns resource
 */
const checkOwnership = (resource, userId, ownerField = 'vendor_id') => {
  return resource && resource[ownerField] === userId;
};

/**
 * Build date range filter for bookings/reports
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} - Sequelize date filter
 */
const buildDateRangeFilter = (startDate, endDate) => {
  if (!startDate || !endDate) return {};

  return {
    createdAt: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  };
};

/**
 * Get pagination offset
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {number} - Offset value
 */
const getPaginationOffset = (page, limit) => {
  return (page - 1) * limit;
};

module.exports = {
  buildHotelSearchConditions,
  buildRoomPriceConditions,
  getHotelIncludes,
  getBookingIncludes,
  calculateBookingAmount,
  checkOwnership,
  buildDateRangeFilter,
  getPaginationOffset
};
