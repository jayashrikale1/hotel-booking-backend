/**
 * Validation Helper Utility
 * Provides common validation functions for API endpoints
 */

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, missingFields: Array }
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date format and check if it's a future date
 * @param {string} dateString - Date string to validate
 * @param {boolean} shouldBeFuture - Whether date should be in future
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateDate = (dateString, shouldBeFuture = false) => {
  const [y, m, d] = String(dateString).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }
  
  if (shouldBeFuture && date < todayStart) {
    return { isValid: false, message: 'Date must be today or in the future' };
  }
  
  return { isValid: true, message: 'Valid date' };
};

/**
 * Validate date range (check-in and check-out dates)
 * @param {string} checkIn - Check-in date
 * @param {string} checkOut - Check-out date
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateDateRange = (checkIn, checkOut) => {
  const [ciY, ciM, ciD] = String(checkIn).split('-').map(Number);
  const [coY, coM, coD] = String(checkOut).split('-').map(Number);
  const checkInDate = new Date(ciY, (ciM || 1) - 1, ciD || 1);
  const checkOutDate = new Date(coY, (coM || 1) - 1, coD || 1);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }
  
  if (checkInDate >= checkOutDate) {
    return { isValid: false, message: 'Check-out date must be after check-in date' };
  }
  
  if (checkInDate < todayStart) {
    return { isValid: false, message: 'Check-in date cannot be before today' };
  }
  
  return { isValid: true, message: 'Valid date range' };
};

/**
 * Validate rating (1-5 scale)
 * @param {number} rating - Rating to validate
 * @returns {boolean} - True if valid rating
 */
const isValidRating = (rating) => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

/**
 * Validate pagination parameters
 * @param {string|number} page - Page number
 * @param {string|number} limit - Items per page
 * @returns {Object} - { page: number, limit: number }
 */
const validatePagination = (page = 1, limit = 10) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
  
  return { page: validPage, limit: validLimit };
};

module.exports = {
  validateRequiredFields,
  isValidEmail,
  isValidPhone,
  validateDate,
  validateDateRange,
  isValidRating,
  validatePagination
};
