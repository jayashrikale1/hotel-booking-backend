/**
 * DEPRECATED CONTROLLER
 * Use role-specific controllers instead:
 * - adminController.js for admin operations
 * - vendorController.js for vendor operations  
 * - userController.js for user operations
 */

const { createError } = require('../middlewares/errorHandler');

const deprecatedEndpoint = () => {
  throw createError('This endpoint is deprecated. Use role-specific controllers instead.', 410);
};

module.exports = {
  addHotel: deprecatedEndpoint,
  uploadImages: deprecatedEndpoint,
  updateHotel: deprecatedEndpoint,
  getHotels: deprecatedEndpoint,
  getHotelById: deprecatedEndpoint,
  deleteHotel: deprecatedEndpoint,
  myHotels: deprecatedEndpoint
};
