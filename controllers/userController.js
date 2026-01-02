/**
 * User Controller
 * Handles user operations - hotel search, booking management, reviews
 */

const { Hotel, HotelImage, Room, Booking, Review, User, Vendor, Payment } = require('../models');
const { Op, literal } = require('sequelize');
const Razorpay = require('razorpay');
require('dotenv').config();
const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY || '',
  key_secret: process.env.RZP_SECRET || ''
});
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
const { sendBookingConfirmationEmail } = require('../utils/mailer');
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
   * Get hotel by ID with full details
   */
  getHotelById: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId, {
      where: { status: 'APPROVED' },
      include: [
        { model: HotelImage, as: 'images' },
        // { model: Room, as: 'rooms' },
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

    hotel.images = (hotel.images || []).filter(img => img.url && img.url.startsWith('/uploads/') && !img.url.includes('/src/assets/'));
    sendSuccess(res, { hotel }, 'Hotel details retrieved successfully');
  }),

  /**
   * Search hotels with advanced filtering
   */
  searchHotels: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const where = buildHotelSearchConditions(req.query);
    // const roomWhere = buildRoomPriceConditions(req.query);
    const offset = getPaginationOffset(page, limit);

    const hotels = await Hotel.findAndCountAll({
      where,
      include: [
        { model: HotelImage, as: 'images' },
        // { 
        //   model: Room, 
        //   as: 'rooms', 
        //   where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
        //   required: Object.keys(roomWhere).length > 0
        // },
        { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'business_name'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    if (hotels.count === 0 && !req.query.status) {
      const relaxedWhere = { ...where };
      delete relaxedWhere.status;
      const retry = await Hotel.findAndCountAll({
        where: relaxedWhere,
        include: [
          { model: HotelImage, as: 'images' },
          // { 
          //   model: Room, 
          //   as: 'rooms', 
          //   where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
          //   required: Object.keys(roomWhere).length > 0
          // },
          { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'business_name'] }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      hotels.count = retry.count;
      hotels.rows = retry.rows;
    }

    const pagination = {
      page,
      totalPages: Math.ceil(hotels.count / limit),
      totalItems: hotels.count,
      limit,
      hasNext: page < Math.ceil(hotels.count / limit),
      hasPrev: page > 1
    };

    const rows = hotels.rows.map(h => {
      h.images = (h.images || []).filter(img => img.url && img.url.startsWith('/uploads/') && !img.url.includes('/src/assets/'));
      return h;
    });
    sendPaginatedResponse(res, rows, pagination, 'Search results retrieved successfully');
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
   * Get hotel room types (AC / NON_AC) with prices and availability
   */
  getHotelRoomTypes: asyncHandler(async (req, res) => {
    const { check_in, check_out } = req.query;
    const hotel = await Hotel.findByPk(req.params.hotelId);
    if (!hotel) {
      throw createError('Hotel not found', 404);
    }
    const acPrice = parseFloat(hotel.ac_room_price || hotel.base_price || 0);
    const nonAcPrice = parseFloat(hotel.non_ac_room_price || hotel.base_price || 0);
    const acTotal = parseInt(hotel.ac_rooms || hotel.available_rooms || hotel.total_rooms || 0);
    const nonAcTotal = parseInt(hotel.non_ac_rooms || hotel.available_rooms || hotel.total_rooms || 0);

    let acAvailable = acTotal;
    let nonAcAvailable = nonAcTotal;

    if (check_in && check_out) {
      const acBookings = await Booking.count({
        where: {
          hotel_id: hotel.id,
          room_type: 'AC',
          status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          [Op.and]: [
            { check_in: { [Op.lt]: check_out } },
            { check_out: { [Op.gt]: check_in } }
          ]
        }
      });
      const nonAcBookings = await Booking.count({
        where: {
          hotel_id: hotel.id,
          room_type: 'NON_AC',
          status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          [Op.and]: [
            { check_in: { [Op.lt]: check_out } },
            { check_out: { [Op.gt]: check_in } }
          ]
        }
      });
      acAvailable = Math.max(0, acTotal - acBookings);
      nonAcAvailable = Math.max(0, nonAcTotal - nonAcBookings);
    }

    const types = [];
    if (acTotal > 0 && acPrice > 0) {
      types.push({
        type: 'AC',
        price_per_night: acPrice,
        total: acTotal,
        available: acAvailable
      });
    }
    if (nonAcTotal > 0 && nonAcPrice > 0) {
      types.push({
        type: 'NON_AC',
        price_per_night: nonAcPrice,
        total: nonAcTotal,
        available: nonAcAvailable
      });
    }

    sendSuccess(res, { hotel_id: hotel.id, types }, 'Room types retrieved successfully');
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
    const { hotel_id, room_type, check_in, check_out, guests = 1, coupon_code } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['hotel_id', 'room_type', 'check_in', 'check_out']);
    if (!validation.isValid) {
      throw createError(`Missing required fields: ${validation.missingFields.join(', ')}`, 400);
    }

    // Validate date range
    const dateValidation = validateDateRange(check_in, check_out);
    if (!dateValidation.isValid) {
      throw createError(dateValidation.message, 400);
    }

    // Validate room type
    const normalizedRoomType = room_type.toUpperCase();
    if (!['AC', 'NON_AC'].includes(normalizedRoomType)) {
      throw createError('Invalid room type. Must be AC or NON_AC', 400);
    }

    // Get hotel details
    const hotel = await Hotel.findByPk(hotel_id, {
      where: { status: 'APPROVED' }
    });

    if (!hotel) {
      throw createError('Hotel not found or not approved', 404);
    }

    // Determine price and capacity
    let pricePerNight = 0;
    let totalCapacity = 0;

    if (normalizedRoomType === 'AC') {
      pricePerNight = parseFloat(hotel.ac_room_price || 0);
      totalCapacity = Number(hotel.ac_rooms || 0);
    } else {
      pricePerNight = parseFloat(hotel.non_ac_room_price || 0);
      totalCapacity = Number(hotel.non_ac_rooms || 0);
    }
    if (!pricePerNight) {
      pricePerNight = parseFloat(hotel.base_price || 0);
    }
    if (totalCapacity <= 0) {
      totalCapacity = Number(hotel.available_rooms || hotel.total_rooms || 0);
    }
    if (!pricePerNight || totalCapacity <= 0) {
      throw createError(`Selected room type (${normalizedRoomType}) is not available at this hotel`, 400);
    }

    // Check availability
    const overlappingBookings = await Booking.count({
      where: {
        hotel_id,
        room_type: normalizedRoomType,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
        [Op.and]: [
          { check_in: { [Op.lt]: check_out } },
          { check_out: { [Op.gt]: check_in } }
        ]
      }
    });

    // Assuming 1 booking = 1 room
    if (overlappingBookings >= totalCapacity) {
      throw createError('No rooms available for the selected dates', 400);
    }

    // Calculate base booking amount
    const { amount: baseAmount, nights } = calculateBookingAmount(pricePerNight, check_in, check_out);
    
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let appliedCouponCode = null;

    // Coupon logic
    if (coupon_code) {
      const { Coupon } = require('../models');
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
      vendor_id: hotel.vendor_id,
      hotel_id,
      room_type: normalizedRoomType,
      // room_id is null
      check_in,
      check_out,
      guests,
      amount: finalAmount,
      price_per_night: pricePerNight,
      coupon_code: appliedCouponCode,
      discount_amount: discountAmount,
      status: 'PENDING'
    });

    // We do NOT decrement available_rooms on the hotel model as it is a summary field.
    // Availability is calculated dynamically.

    sendSuccess(res, { 
      booking, 
      amount: finalAmount, 
      price_per_night: pricePerNight,
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
    const { page: queryPage, limit: queryLimit, status } = req.query;
    
    // Validate pagination
    const { page, limit } = validatePagination(queryPage, queryLimit);

    // Build where conditions
    const where = { user_id: req.user.id };
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    const offset = getPaginationOffset(page, limit);

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: getBookingIncludes(),
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const pagination = {
      page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      limit,
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1
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
   * Get payment key
   */
  getPaymentKey: asyncHandler(async (req, res) => {
    sendSuccess(res, { key_id: process.env.RZP_KEY }, 'Payment key retrieved');
  }),

  /**
   * Initiate payment for a booking (creates Razorpay order and Payment record)
   */
  initiatePayment: asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      where: { id: req.params.bookingId, user_id: req.user.id }
    });
    if (!booking) {
      throw createError('Booking not found', 404);
    }
    if (!booking.amount || booking.amount <= 0) {
      throw createError('Invalid booking amount', 400);
    }
    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(booking.amount) * 100),
      currency: 'INR',
      receipt: `rcpt_${booking.id}`
    });
    const payment = await Payment.create({
      booking_id: booking.id,
      gateway: 'RAZORPAY',
      gateway_payment_id: order.id,
      amount: booking.amount,
      status: 'INITIATED'
    });
    sendSuccess(res, { order, payment, key_id: process.env.RZP_KEY }, 'Payment initiated');
  }),

  /**
   * Complete payment for a booking (manual test endpoint)
   */
  completePayment: asyncHandler(async (req, res) => {
    const { gateway_payment_id, status } = req.body;
    
    // Fetch booking with all necessary relations for email
    const booking = await Booking.findOne({
      where: { id: req.params.bookingId, user_id: req.user.id },
      include: [
        { model: Hotel, as: 'hotel' },
        { model: User, as: 'user' }
      ]
    });

    if (!booking) {
      throw createError('Booking not found', 404);
    }
    const payment = await Payment.findOne({ where: { booking_id: booking.id } });
    if (!payment) {
      throw createError('Payment not found', 404);
    }
    payment.gateway_payment_id = gateway_payment_id || payment.gateway_payment_id;
    payment.status = String(status).toLowerCase() === 'success' ? 'SUCCESS' : 'FAILED';
    await payment.save();
    
    if (payment.status === 'SUCCESS') {
      booking.status = 'CONFIRMED';
      booking.payment_id = payment.gateway_payment_id;
      await booking.save();

      // Send confirmation email
      if (booking.user && booking.user.email) {
        await sendBookingConfirmationEmail(booking.user.email, {
          userName: booking.user.full_name || 'Valued Guest',
          hotelName: booking.hotel ? booking.hotel.name : 'Hotel',
          hotelAddress: booking.hotel ? booking.hotel.address : '',
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          roomType: booking.room_type,
          totalAmount: booking.amount,
          bookingId: booking.id,
          guests: booking.guests
        });
      }
    } else {
      booking.status = 'CANCELLED';
      await booking.save();
    }
    sendSuccess(res, { payment, booking }, 'Payment status updated');
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
      // For development/testing: allow cancellation anytime
      // const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
      
      // if (hoursUntilCheckIn < 24) {
      //   throw createError('Cannot cancel booking less than 24 hours before check-in', 400);
      // }
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
    let user;
    try {
      user = await User.findByPk(req.user.id, {
        attributes: ['id', 'full_name', 'email', 'phone', 'address', 'profile_photo', 'is_verified', 'createdAt']
      });
    } catch (err) {
      if (/Unknown column 'profile_photo'/i.test(err.message)) {
        user = await User.findByPk(req.user.id, {
          attributes: ['id', 'full_name', 'email', 'phone', 'address', 'is_verified', 'createdAt']
        });
      } else {
        throw err;
      }
    }

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

    // Accept common alias keys from frontend forms
    const {
      full_name,
      fullName,
      phone,
      phone_number,
      mobile,
      address
    } = req.body || {};
    const updateData = {};
    
    if (full_name || fullName) updateData.full_name = (full_name || fullName).trim();
    if (phone || phone_number || mobile) updateData.phone = (phone || phone_number || mobile).trim();
    if (address) updateData.address = String(address).trim();
    if (req.file && req.file.filename) updateData.profile_photo = req.file.filename;
    
    if (Object.keys(updateData).length === 0) {
      return sendError(res, 'No profile fields provided to update', 400);
    }

    try {
      await user.update(updateData);
    } catch (err) {
      if (/Unknown column 'profile_photo'/i.test(err.message)) {
        delete updateData.profile_photo;
        await user.update(updateData);
      } else {
        throw err;
      }
    }
    sendSuccess(res, { user }, 'Profile updated successfully');
  })
};
