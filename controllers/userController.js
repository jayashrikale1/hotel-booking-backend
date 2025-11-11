/**
 * User Controller
 * Handles user operations - hotel search, booking management, reviews
 */

const { Hotel, HotelImage, Room, Booking, Review, User, Vendor } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHelper');
const { validateRequiredFields, validateDateRange, isValidRating, validatePagination } = require('../utils/validationHelper');
const { 
  buildHotelSearchConditions, 
  buildRoomPriceConditions,
  getHotelIncludes, 
  getBookingIncludes, 
  getPaginationOffset,
  calculateBookingAmount
} = require('../utils/dbHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

// Helper function to create error
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  // ============ HOTEL BROWSING ============

  /**
   * Get all hotels with filtering and pagination
   */
  getAllHotels: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const where = buildHotelSearchConditions(req.query);
    const roomWhere = buildRoomPriceConditions(req.query);
    const offset = getPaginationOffset(page, limit);

    const hotels = await Hotel.findAndCountAll({
      where,
      include: [
        { model: HotelImage, as: 'images' },
        { 
          model: Room, 
          as: 'rooms', 
          where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
          required: false 
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const pagination = {
      page,
      totalPages: Math.ceil(hotels.count / limit),
      totalItems: hotels.count,
      limit,
      hasNext: page < Math.ceil(hotels.count / limit),
      hasPrev: page > 1
    };

    sendPaginatedResponse(res, hotels.rows, pagination, 'Hotels retrieved successfully');
  }),

  /**
   * Get hotel by ID with full details
   */
  getHotelById: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId, {
      where: { status: 'APPROVED' },
      include: [
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms' },
        { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'business_name'] },
        { 
          model: Review, 
          as: 'reviews',
          include: [{ model: User, as: 'user', attributes: ['full_name'] }]
        }
      ]
    });

    if (!hotel) {
      throw createError('Hotel not found', 404);
    }

    sendSuccess(res, { hotel }, 'Hotel details retrieved successfully');
  }),

  /**
   * Search hotels with advanced filtering
   */
  searchHotels: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const where = buildHotelSearchConditions(req.query);
    const roomWhere = buildRoomPriceConditions(req.query);
    const offset = getPaginationOffset(page, limit);

    const hotels = await Hotel.findAndCountAll({
      where,
      include: [
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms', where: roomWhere, required: true }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const pagination = {
      page,
      totalPages: Math.ceil(hotels.count / limit),
      totalItems: hotels.count,
      limit,
      hasNext: page < Math.ceil(hotels.count / limit),
      hasPrev: page > 1
    };

    sendPaginatedResponse(res, hotels.rows, pagination, 'Search results retrieved successfully');
  }),

  // ============ ROOM BROWSING ============

  /**
   * Get rooms by hotel ID
   */
  getRoomsByHotel: asyncHandler(async (req, res) => {
    const roomWhere = { 
      hotel_id: req.params.hotelId,
      ...buildRoomPriceConditions(req.query)
    };

    const rooms = await Room.findAll({
      where: roomWhere,
      include: [{ 
        model: Hotel, 
        as: 'hotel', 
        attributes: ['id', 'name', 'status'],
        where: { status: 'APPROVED' }
      }],
      order: [['price', 'ASC']]
    });

    sendSuccess(res, { rooms }, 'Rooms retrieved successfully');
  }),

  /**
   * Get room by ID with hotel details
   */
  getRoomById: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId, {
      include: [{ 
        model: Hotel, 
        as: 'hotel', 
        where: { status: 'APPROVED' },
        include: [{ model: HotelImage, as: 'images' }]
      }]
    });

    if (!room) {
      throw createError('Room not found', 404);
    }

    sendSuccess(res, { room }, 'Room details retrieved successfully');
  }),

  // ============ BOOKING MANAGEMENT ============

  /**
   * Create a new booking
   */
  createBooking: asyncHandler(async (req, res) => {
    const { hotel_id, room_id, check_in, check_out, guests = 1, coupon_code } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['hotel_id', 'room_id', 'check_in', 'check_out']);
    if (!validation.isValid) {
      throw createError(`Missing required fields: ${validation.missingFields.join(', ')}`, 400);
    }

    // Validate date range
    const dateValidation = validateDateRange(check_in, check_out);
    if (!dateValidation.isValid) {
      throw createError(dateValidation.message, 400);
    }

    // Validate room availability
    const room = await Room.findByPk(room_id, {
      include: [{ model: Hotel, as: 'hotel', where: { status: 'APPROVED' } }]
    });

    if (!room) {
      throw createError('Room not found or hotel not approved', 404);
    }

    if (room.available_rooms < 1) {
      throw createError('Room not available', 400);
    }

    // Calculate base booking amount
    const { amount: baseAmount, nights } = calculateBookingAmount(room.price, check_in, check_out);
    
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let appliedCouponCode = null;

    // Apply coupon if provided
    if (coupon_code) {
      const { Coupon } = require('../models');
      const { Op, literal } = require('sequelize');
      const now = new Date();
      
      const coupon = await Coupon.findOne({
        where: {
          code: coupon_code,
          active: true,
          expiry: { [Op.or]: [{ [Op.gt]: now }, null] },
          used_count: { [Op.lt]: literal('usage_limit') }
        }
      });

      if (coupon) {
        if (coupon.type === 'PERCENT') {
          discountAmount = (baseAmount * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
        discountAmount = Math.min(discountAmount, baseAmount);
        finalAmount = Math.max(0, baseAmount - discountAmount);
        appliedCouponCode = coupon.code;
      }
    }

    // Create booking
    const booking = await Booking.create({
      user_id: req.user.id,
      vendor_id: room.hotel.vendor_id,
      hotel_id,
      room_id,
      check_in,
      check_out,
      guests,
      amount: finalAmount,
      coupon_code: appliedCouponCode,
      discount_amount: discountAmount,
      status: 'PENDING'
    });

    // Update room availability
    await room.update({ available_rooms: room.available_rooms - 1 });

    sendSuccess(res, { 
      booking, 
      amount: finalAmount, 
      base_amount: baseAmount,
      discount_amount: discountAmount,
      nights,
      coupon_applied: appliedCouponCode 
    }, 'Booking created successfully', 201);
  }),

  /**
   * Get user's bookings with pagination
   */
  getMyBookings: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    
    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      throw createError(paginationValidation.message, 400);
    }

    // Build where conditions
    const where = { user_id: req.user.id };
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    const offset = getPaginationOffset(parseInt(page), parseInt(limit));

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: getBookingIncludes(),
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const pagination = {
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      limit: parseInt(limit),
      hasNext: parseInt(page) < Math.ceil(count / parseInt(limit)),
      hasPrev: parseInt(page) > 1
    };

    sendPaginatedResponse(res, bookings, pagination, 'Bookings retrieved successfully');
  }),

  /**
   * Get booking by ID
   */
  getBookingById: asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      where: { 
        id: req.params.bookingId,
        user_id: req.user.id 
      },
      include: getBookingIncludes()
    });

    if (!booking) {
      throw createError('Booking not found', 404);
    }

    sendSuccess(res, { booking }, 'Booking details retrieved successfully');
  }),

  /**
   * Cancel a booking
   */
  cancelBooking: asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      where: { 
        id: req.params.bookingId,
        user_id: req.user.id 
      }
    });

    if (!booking) {
      throw createError('Booking not found', 404);
    }

    if (booking.status === 'CANCELLED') {
      throw createError('Booking already cancelled', 400);
    }

    // Check cancellation policy for confirmed bookings
    if (booking.status === 'CONFIRMED') {
      const checkInDate = new Date(booking.check_in);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilCheckIn < 24) {
        throw createError('Cannot cancel booking less than 24 hours before check-in', 400);
      }
    }

    // Cancel booking and restore room availability
    await booking.update({ status: 'CANCELLED' });
    
    const room = await Room.findByPk(booking.room_id);
    if (room) {
      await room.update({ available_rooms: room.available_rooms + 1 });
    }

    sendSuccess(res, { booking }, 'Booking cancelled successfully');
  }),

  // ============ REVIEW MANAGEMENT ============

  /**
   * Create a review for a hotel
   */
  createReview: asyncHandler(async (req, res) => {
    const { hotel_id, rating, comment } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['hotel_id', 'rating', 'comment']);
    if (!validation.isValid) {
      throw createError(`Missing required fields: ${validation.missingFields.join(', ')}`, 400);
    }

    // Validate rating
    if (!isValidRating(rating)) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    // Check if user has a completed booking for this hotel
    const booking = await Booking.findOne({
      where: {
        user_id: req.user.id,
        hotel_id,
        status: 'COMPLETED'
      }
    });

    if (!booking) {
      throw createError('You can only review hotels you have completed bookings for', 403);
    }

    // Check if user already reviewed this hotel
    const existingReview = await Review.findOne({
      where: {
        user_id: req.user.id,
        hotel_id
      }
    });

    if (existingReview) {
      throw createError('You have already reviewed this hotel', 400);
    }

    const review = await Review.create({
      user_id: req.user.id,
      hotel_id,
      rating,
      comment
    });

    // Update hotel rating
    const hotel = await Hotel.findByPk(hotel_id, {
      include: [{ model: Review, as: 'reviews' }]
    });
    
    if (hotel && hotel.reviews.length > 0) {
      const avgRating = hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / hotel.reviews.length;
      await hotel.update({ rating: Math.round(avgRating * 10) / 10 });
    }

    sendSuccess(res, { review }, 'Review created successfully', 201);
  }),

  /**
   * Get user's reviews
   */
  getMyReviews: asyncHandler(async (req, res) => {
    const reviews = await Review.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { reviews }, 'Reviews retrieved successfully');
  }),

  /**
   * Update a review
   */
  updateReview: asyncHandler(async (req, res) => {
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId,
        user_id: req.user.id
      }
    });

    if (!review) {
      throw createError('Review not found', 404);
    }

    const { rating, comment } = req.body;
    const updateData = {};
    
    if (rating !== undefined) {
      if (!isValidRating(rating)) {
        throw createError('Rating must be between 1 and 5', 400);
      }
      updateData.rating = rating;
    }
    
    if (comment) updateData.comment = comment;

    await review.update(updateData);
    sendSuccess(res, { review }, 'Review updated successfully');
  }),

  /**
   * Delete a review
   */
  deleteReview: asyncHandler(async (req, res) => {
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId,
        user_id: req.user.id
      }
    });

    if (!review) {
      throw createError('Review not found', 404);
    }

    await review.destroy();
    sendSuccess(res, null, 'Review deleted successfully');
  }),

  // ============ USER PROFILE ============

  /**
   * Get user profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'full_name', 'email', 'phone', 'is_verified', 'createdAt']
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    sendSuccess(res, { user }, 'Profile retrieved successfully');
  }),

  /**
   * Update user profile
   */
  updateProfile: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw createError('User not found', 404);
    }

    const { full_name, phone } = req.body;
    const updateData = {};
    
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;

    await user.update(updateData);
    sendSuccess(res, { user }, 'Profile updated successfully');
  })
};
