/**
 * Vendor Controller
 * Handles vendor operations - hotel management, room management, booking management
 */

const { Hotel, HotelImage, Room, Booking, User, Vendor, Review } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHelper');
const { validateRequiredFields, validatePagination, isValidEmail } = require('../utils/validationHelper');
const { 
  getHotelIncludes, 
  getBookingIncludes, 
  getPaginationOffset 
} = require('../utils/dbHelper');
const { asyncHandler } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

// Helper function to create error
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Helper function to build date range filter
const buildDateRangeFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) {
    filter.createdAt = { [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    filter.createdAt = { ...filter.createdAt, [Op.lte]: new Date(endDate) };
  }
  return filter;
};

module.exports = {
  // ============ HOTEL MANAGEMENT ============

  /**
 * Create a new hotel
 */
createHotel: asyncHandler(async (req, res) => {
  const {
    name, description, address, city, state, pincode, country,
    latitude, longitude, amenities, phone, email, rating,
    total_rooms, available_rooms, base_price, featured
  } = req.body;

  const vendor = await Vendor.findByPk(req.user.id);
  if (!vendor) {
    throw createError('Vendor not found', 404);
  }
  if (vendor.status !== 'ACTIVE') {
    throw createError('Vendor account is not active', 403);
  }

  // Validate required fields
  const validation = validateRequiredFields(req.body, ['name', 'address', 'city']);
  if (!validation.isValid) {
    throw createError(`Missing required fields: ${validation.missingFields.join(', ')}`, 400);
  }

  if (email && !isValidEmail(email)) {
    throw createError('Invalid email format', 400);
  }

  // Helpers
  const normalizeAmenities = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const t = val.trim();
      if (!t) return null;
      if (t.startsWith('[')) { try { const p = JSON.parse(t); return Array.isArray(p) ? p : null; } catch { /* noop */ } }
      return t.split(',').map(s => s.trim()).filter(Boolean);
    }
    return val == null ? null : [];
  };

  const lat = latitude === '' || latitude === null || typeof latitude === 'undefined' ? null : parseFloat(latitude);
  const lng = longitude === '' || longitude === null || typeof longitude === 'undefined' ? null : parseFloat(longitude);
  const parsedRating = rating === '' || rating === null || typeof rating === 'undefined' ? 0.0 : Math.max(0, Math.min(5, parseFloat(rating)));
  const parsedTotal = total_rooms === '' || total_rooms === null || typeof total_rooms === 'undefined' ? 0 : parseInt(total_rooms);
  let parsedAvail = available_rooms === '' || available_rooms === null || typeof available_rooms === 'undefined' ? parsedTotal : parseInt(available_rooms);
  parsedAvail = Math.max(0, Math.min(parsedAvail, parsedTotal));
  const parsedPrice = base_price === '' || base_price === null || typeof base_price === 'undefined' ? 0.0 : Math.max(0, parseFloat(base_price));
  const parsedFeatured = typeof featured === 'boolean' ? featured : (String(featured).toLowerCase() === 'true');

  const hotel = await Hotel.create({
    vendor_id: req.user.id,
    name,
    description,
    address,
    city,
    state,
    pincode,
    country: country || 'India',
    latitude: lat,
    longitude: lng,
    amenities: normalizeAmenities(amenities),
    phone: phone || null,
    email: email || null,
    rating: parsedRating,
    total_rooms: parsedTotal,
    available_rooms: parsedAvail,
    base_price: parsedPrice,
    featured: parsedFeatured,
    status: 'PENDING'
  });

  sendSuccess(res, { hotel }, 'Hotel created successfully and is pending approval', 201);
}),


  /**
   * Get vendor's hotels with pagination
   */
  getMyHotels: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const where = { vendor_id: req.user.id };
    
    if (req.query.status) {
      where.status = req.query.status;
    }

    const offset = getPaginationOffset(page, limit);

    const hotels = await Hotel.findAndCountAll({
      where,
      include: [
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms' }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const rows = hotels.rows.map(h => {
      h.images = (h.images || []).filter(img => img.url && img.url.startsWith('/uploads/') && !img.url.includes('/src/assets/'));
      return h;
    });

    const pagination = {
      page,
      totalPages: Math.ceil(hotels.count / limit),
      totalItems: hotels.count,
      limit,
      hasNext: page < Math.ceil(hotels.count / limit),
      hasPrev: page > 1
    };

    sendPaginatedResponse(res, rows, pagination, 'Hotels retrieved successfully');
  }),


  /**
 * Get all approved hotels (Public - No authentication required)
 */
getAllHotelsPublic: asyncHandler(async (req, res) => {
  try {
    const { city, state, country, status } = req.query; // Optional filters
    const where = {};
    if (!status || status === 'APPROVED') {
      where.status = 'APPROVED';
    } else if (status !== 'ALL') {
      where.status = status;
    }

    // Apply filters if provided
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (state) where.state = { [Op.like]: `%${state}%` };
    if (country) where.country = { [Op.like]: `%${country}%` };

    let hotels = await Hotel.findAll({
      where,
      include: [
        {
          model: HotelImage,
          as: 'images',
          attributes: ['id', 'url']
        },
        {
          model: Room,
          as: 'rooms',
          attributes: ['id', 'type', 'price', 'available_rooms'] // ✅ removed capacity
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'full_name', 'email', 'business_name', 'phone', 'business_address'] // ✅ added extra vendor info
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if ((!status || status === 'APPROVED') && hotels.length === 0) {
      const whereNoStatus = { ...where };
      delete whereNoStatus.status;
      hotels = await Hotel.findAll({
        where: whereNoStatus,
        include: [
          { model: HotelImage, as: 'images', attributes: ['id', 'url'] },
          { model: Room, as: 'rooms', attributes: ['id', 'type', 'price', 'available_rooms'] },
          { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'email', 'business_name', 'phone', 'business_address'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    const clean = hotels.map(h => {
      h.images = (h.images || []).filter(img => img.url && img.url.startsWith('/uploads/') && !img.url.includes('/src/assets/'));
      return h;
    });
    sendSuccess(res, { hotels: clean }, 'Hotels retrieved successfully');
  } catch (error) {
    console.error('Error fetching hotels:', error);
    sendError(res, 'Failed to retrieve hotels');
  }
}),



  /**
   * Get hotel by ID (vendor ownership check)
   */
  getHotelById: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findOne({
      where: { 
        id: req.params.hotelId,
        vendor_id: req.user.id 
      },
      include: [
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms' },
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
 * Update hotel information
 */
updateHotel: asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOne({
    where: { 
      id: req.params.hotelId,
      vendor_id: req.user.id 
    }
  });

  if (!hotel) {
    throw createError('Hotel not found', 404);
  }

  const body = req.body || {};
  const updates = {};
  const hasProp = (k) => Object.prototype.hasOwnProperty.call(body, k);

  // Allowlisted strings
  if (hasProp('name')) updates.name = body.name;
  if (hasProp('description')) updates.description = body.description;
  if (hasProp('address')) updates.address = body.address;
  if (hasProp('city')) updates.city = body.city;
  if (hasProp('state')) updates.state = body.state;
  if (hasProp('pincode')) updates.pincode = body.pincode;
  if (hasProp('country')) updates.country = body.country;
  if (hasProp('phone')) updates.phone = body.phone;
  if (hasProp('email')) {
    if (body.email && !isValidEmail(body.email)) {
      throw createError('Invalid email format', 400);
    }
    updates.email = body.email;
  }

  // Numeric/nullable
  if (hasProp('latitude')) {
    updates.latitude = body.latitude === '' || body.latitude === null ? null : parseFloat(body.latitude);
  }
  if (hasProp('longitude')) {
    updates.longitude = body.longitude === '' || body.longitude === null ? null : parseFloat(body.longitude);
  }
  if (hasProp('rating')) {
    const r = body.rating === '' || body.rating === null ? 0.0 : parseFloat(body.rating);
    updates.rating = Math.max(0, Math.min(5, isNaN(r) ? 0.0 : r));
  }
  if (hasProp('base_price')) {
    const bp = body.base_price === '' || body.base_price === null ? 0.0 : parseFloat(body.base_price);
    updates.base_price = Math.max(0, isNaN(bp) ? 0.0 : bp);
  }
  if (hasProp('featured')) {
    updates.featured = typeof body.featured === 'boolean' ? body.featured : (String(body.featured).toLowerCase() === 'true');
  }

  // Room counters with clamping
  const hasTotal = hasProp('total_rooms');
  const hasAvail = hasProp('available_rooms');
  if (hasTotal) {
    const t = body.total_rooms === '' || body.total_rooms === null ? 0 : parseInt(body.total_rooms);
    updates.total_rooms = isNaN(t) ? hotel.total_rooms : t;
    if (!hasAvail) updates.available_rooms = Math.max(0, Math.min(hotel.available_rooms, updates.total_rooms));
  }
  if (hasAvail) {
    const a = body.available_rooms === '' || body.available_rooms === null ? 0 : parseInt(body.available_rooms);
    const targetTotal = hasTotal ? updates.total_rooms : hotel.total_rooms;
    const newAvail = isNaN(a) ? hotel.available_rooms : a;
    updates.available_rooms = Math.max(0, Math.min(newAvail, targetTotal));
  }

  // Amenities normalization -> JSON array
  if (hasProp('amenities')) {
    const val = body.amenities;
    if (Array.isArray(val)) {
      updates.amenities = val.length ? val : null;
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) {
        updates.amenities = null;
      } else if (trimmed.startsWith('[')) {
        try { const parsed = JSON.parse(trimmed); updates.amenities = Array.isArray(parsed) ? parsed : null; }
        catch { const arr = trimmed.split(',').map(s => s.trim()).filter(Boolean); updates.amenities = arr.length ? arr : null; }
      } else {
        const arr = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        updates.amenities = arr.length ? arr : null;
      }
    } else if (val == null) {
      updates.amenities = null;
    }
  }

  // Block restricted fields
  if (hasProp('status')) delete updates.status;
  if (hasProp('vendor_id')) delete updates.vendor_id;

  if (Object.keys(updates).length === 0) {
    throw createError('No valid fields provided to update', 400);
  }

  await hotel.update(updates);
  sendSuccess(res, { hotel }, 'Hotel updated successfully');
}),





  /**
   * Delete hotel (with active booking check)
   */
  deleteHotel: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findOne({
      where: { 
        id: req.params.hotelId,
        vendor_id: req.user.id 
      }
    });

    if (!hotel) {
      throw createError('Hotel not found', 404);
    }

    // Check for active bookings
    const activeBookings = await Booking.count({
      where: {
        hotel_id: hotel.id,
        status: ['PENDING', 'CONFIRMED']
      }
    });

    if (activeBookings > 0) {
      throw createError('Cannot delete hotel with active bookings', 400);
    }

    await hotel.destroy();
    sendSuccess(res, null, 'Hotel deleted successfully');
  }),



// In controllers/vendorController.js
// Add this method near other hotel endpoints (e.g., after deleteHotel, before uploadHotelImages)

 /**
  * Get hotel images (vendor-owned)
  */
 getHotelImages: asyncHandler(async (req, res) => {
  const hotel = await Hotel.findOne({
    where: {
      id: req.params.hotelId,
      vendor_id: req.user.id
    }
  });

  if (!hotel) {
    throw createError('Hotel not found', 404);
  }

  const images = await HotelImage.findAll({
    where: { hotel_id: hotel.id },
    order: [['createdAt', 'DESC']]
  });

  // Frontend expects `url` field; our model provides `url`
  sendSuccess(res, { images }, 'Images retrieved successfully');
}),


  /**
   * Upload hotel images
   */
  uploadHotelImages: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findOne({
      where: { 
        id: req.params.hotelId,
        vendor_id: req.user.id 
      }
    });

    if (!hotel) {
      throw createError('Hotel not found', 404);
    }

    const files = req.files || [];
    if (files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    const savedImages = [];
    for (const file of files) {
      const image = await HotelImage.create({
        hotel_id: hotel.id,
        url: `/uploads/${file.filename}`
      });
      savedImages.push(image);
    }

    sendSuccess(res, { images: savedImages }, 'Images uploaded successfully');
  }),

  /**
   * Delete hotel image
   */
  deleteHotelImage: asyncHandler(async (req, res) => {
    const image = await HotelImage.findByPk(req.params.imageId, {
      include: [{ 
        model: Hotel, 
        as: 'hotel',
        where: { vendor_id: req.user.id }
      }]
    });

    if (!image) {
      throw createError('Image not found', 404);
    }

    await image.destroy();
    sendSuccess(res, null, 'Image deleted successfully');
  }),

  // ============ ROOM MANAGEMENT ============

  /**
   * Create a room for hotel
   */
  createRoom: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findOne({
      where: { 
        id: req.params.hotelId,
        vendor_id: req.user.id 
      }
    });

    if (!hotel) {
      throw createError('Hotel not found', 404);
    }

    const {
      type,
      price,
      total_rooms,
      amenities,
      // Alternate field names used in some clients/older swagger
      room_type,
      price_per_night,
      max_occupancy
    } = req.body;

    // Normalize inputs
    const normalizedType = (type || room_type || '').toString().trim();
    const normalizedPriceRaw = price != null ? price : price_per_night;
    const normalizedPrice = normalizedPriceRaw === '' || normalizedPriceRaw == null
      ? NaN
      : parseFloat(normalizedPriceRaw);
    // total_rooms historically represents how many such rooms exist. If not provided, default to 1.
    const totalRoomsRaw = total_rooms != null ? total_rooms : undefined;
    const normalizedTotalRooms = totalRoomsRaw === '' || totalRoomsRaw == null
      ? 1
      : parseInt(totalRoomsRaw);

    // Validate required fields (type + price). total_rooms is optional, defaults to 1.
    if (!normalizedType || Number.isNaN(normalizedPrice)) {
      const missing = [];
      if (!normalizedType) missing.push('type');
      if (Number.isNaN(normalizedPrice)) missing.push('price');
      throw createError(`Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Normalize amenities (array or comma-separated string -> JSON array or null)
    let normalizedAmenities = null;
    if (Array.isArray(amenities)) {
      normalizedAmenities = amenities.length ? amenities : null;
    } else if (typeof amenities === 'string') {
      const trimmed = amenities.trim();
      if (trimmed) {
        if (trimmed.startsWith('[')) {
          try { const parsed = JSON.parse(trimmed); normalizedAmenities = Array.isArray(parsed) ? parsed : null; }
          catch { normalizedAmenities = trimmed.split(',').map(s => s.trim()).filter(Boolean); }
        } else {
          normalizedAmenities = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const room = await Room.create({
      hotel_id: hotel.id,
      type: normalizedType,
      price: Math.max(0, normalizedPrice),
      total_rooms: Math.max(1, Number.isNaN(normalizedTotalRooms) ? 1 : normalizedTotalRooms),
      available_rooms: Math.max(1, Number.isNaN(normalizedTotalRooms) ? 1 : normalizedTotalRooms),
      amenities: normalizedAmenities ? JSON.stringify(normalizedAmenities) : null
    });

    sendSuccess(res, { room }, 'Room created successfully', 201);
  }),

  /**
   * Get rooms for specific hotel
   */
  getMyRooms: asyncHandler(async (req, res) => {
    const { hotelId } = req.params;
    
    // Verify hotel ownership
    const hotel = await Hotel.findOne({
      where: { 
        id: hotelId,
        vendor_id: req.user.id 
      }
    });

    if (!hotel) {
      throw createError('Hotel not found', 404);
    }

    const rooms = await Room.findAll({
      where: { hotel_id: hotelId },
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { rooms }, 'Rooms retrieved successfully');
  }),

  /**
   * Get all rooms across all vendor's hotels
   */
  getAllMyRooms: asyncHandler(async (req, res) => {
    const rooms = await Room.findAll({
      include: [{
        model: Hotel,
        as: 'hotel',
        where: { vendor_id: req.user.id },
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { rooms }, 'All rooms retrieved successfully');
  }),

  /**
   * Get room by ID (with ownership check)
   */
  getRoomById: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId, {
      include: [{
        model: Hotel,
        as: 'hotel',
        where: { vendor_id: req.user.id }
      }]
    });

    if (!room) {
      throw createError('Room not found', 404);
    }

    sendSuccess(res, { room }, 'Room details retrieved successfully');
  }),

  /**
   * Update room information
   */
  updateRoom: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId, {
      include: [{
        model: Hotel,
        as: 'hotel',
        where: { vendor_id: req.user.id }
      }]
    });

    if (!room) {
      throw createError('Room not found', 404);
    }

    const { type, price, total_rooms, amenities } = req.body;
    const updateData = {};
    
    if (type) updateData.type = type;
    if (price) updateData.price = parseFloat(price);
    if (total_rooms) {
      const newTotal = parseInt(total_rooms);
      updateData.total_rooms = newTotal;
      
      // Adjust available rooms proportionally
      const currentAvailable = room.available_rooms;
      const currentTotal = room.total_rooms;
      const ratio = currentAvailable / currentTotal;
      updateData.available_rooms = Math.floor(newTotal * ratio);
    }
    if (amenities) updateData.amenities = JSON.stringify(amenities);

    await room.update(updateData);
    sendSuccess(res, { room }, 'Room updated successfully');
  }),

  /**
   * Delete room (with active booking check)
   */
  deleteRoom: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId, {
      include: [{
        model: Hotel,
        as: 'hotel',
        where: { vendor_id: req.user.id }
      }]
    });

    if (!room) {
      throw createError('Room not found', 404);
    }

    // Check for active bookings
    const activeBookings = await Booking.count({
      where: {
        room_id: room.id,
        status: ['PENDING', 'CONFIRMED']
      }
    });

    if (activeBookings > 0) {
      throw createError('Cannot delete room with active bookings', 400);
    }

    await room.destroy();
    sendSuccess(res, null, 'Room deleted successfully');
  }),

  // ============ BOOKING MANAGEMENT ============

  /**
   * Get vendor's bookings with pagination
   */
  getMyBookings: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const where = { vendor_id: req.user.id };
    
    if (req.query.status) {
      where.status = req.query.status;
    }

    const offset = getPaginationOffset(page, limit);

    const bookings = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone'] },
        { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'type', 'price'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const pagination = {
      page,
      totalPages: Math.ceil(bookings.count / limit),
      totalItems: bookings.count,
      limit,
      hasNext: page < Math.ceil(bookings.count / limit),
      hasPrev: page > 1
    };

    sendPaginatedResponse(res, bookings.rows, pagination, 'Bookings retrieved successfully');
  }),

  /**
   * Get bookings of a specific user (scoped to current vendor) with pagination
   */
  getUserBookings: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const offset = getPaginationOffset(page, limit);
    const { status } = req.query;

    const where = { vendor_id: req.user.id, user_id: userId };
    if (status) where.status = status;

    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone'] },
        { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'type', 'price'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const pagination = {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + rows.length < count,
      hasPrev: page > 1
    };

    return sendPaginatedResponse(res, rows, pagination, 'User bookings retrieved successfully');
  }),

  /**
   * Get booking by ID (with ownership check)
   */
  getBookingById: asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      where: { 
        id: req.params.bookingId,
        vendor_id: req.user.id 
      },
      include: getBookingIncludes()
    });

    if (!booking) {
      throw createError('Booking not found', 404);
    }

    sendSuccess(res, { booking }, 'Booking details retrieved successfully');
  }),

  /**
   * Update booking status (confirm/cancel)
   */
  updateBookingStatus: asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      throw createError('Invalid status. Must be CONFIRMED or CANCELLED', 400);
    }

    const booking = await Booking.findOne({
      where: { 
        id: req.params.bookingId,
        vendor_id: req.user.id 
      }
    });

    if (!booking) {
      throw createError('Booking not found', 404);
    }

    await booking.update({ status });

    // If cancelled, restore room availability
    if (status === 'CANCELLED') {
      const room = await Room.findByPk(booking.room_id);
      if (room) {
        await room.update({ available_rooms: room.available_rooms + 1 });
      }
    }

    sendSuccess(res, { booking }, `Booking ${status.toLowerCase()} successfully`);
  }),

  // ============ ANALYTICS & REPORTS ============

  /**
   * Get vendor dashboard statistics
   */
  getDashboardStats: asyncHandler(async (req, res) => {
    const [
      totalHotels,
      approvedHotels,
      pendingHotels,
      totalRooms,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      revenueResult
    ] = await Promise.all([
      Hotel.count({ where: { vendor_id: req.user.id } }),
      Hotel.count({ where: { vendor_id: req.user.id, status: 'APPROVED' } }),
      Hotel.count({ where: { vendor_id: req.user.id, status: 'PENDING' } }),
      Room.count({ include: [{ model: Hotel, as: 'hotel', where: { vendor_id: req.user.id } }] }),
      Booking.count({ where: { vendor_id: req.user.id } }),
      Booking.count({ where: { vendor_id: req.user.id, status: 'CONFIRMED' } }),
      Booking.count({ where: { vendor_id: req.user.id, status: 'PENDING' } }),
      Booking.findAll({
        where: { vendor_id: req.user.id, status: 'CONFIRMED' },
        attributes: [[require('sequelize').fn('SUM', require('sequelize').col('amount')), 'totalRevenue']]
      })
    ]);

    const totalRevenue = revenueResult[0]?.dataValues?.totalRevenue || 0;

    const stats = {
      totalHotels,
      approvedHotels,
      pendingHotels,
      totalRooms,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue: parseFloat(totalRevenue) || 0
    };

    sendSuccess(res, { stats }, 'Dashboard statistics retrieved successfully');
  }),

  /**
   * Get revenue report with date filtering
   */
  getRevenueReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const where = { 
      vendor_id: req.user.id, 
      status: 'CONFIRMED',
      ...buildDateRangeFilter(startDate, endDate)
    };

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'type'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);

    sendSuccess(res, {
      bookings,
      totalRevenue,
      count: bookings.length
    }, 'Revenue report generated successfully');
  })
};