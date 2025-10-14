/**
 * Admin Controller
 * Handles admin operations - user management, hotel management, booking management, analytics
 */

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Admin, User, Vendor, Hotel, Booking, Room, HotelImage, Review, Coupon, Payment } = require('../models');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHelper');
const { validateRequiredFields, isValidEmail, validatePagination } = require('../utils/validationHelper');
const { getHotelIncludes, getBookingIncludes, getPaginationOffset } = require('../utils/dbHelper');
const { asyncHandler } = require('../middlewares/errorHandler');

module.exports = {
  // ============ USER MANAGEMENT ============

  /**
   * Create new user or vendor account
   */
  createUser: asyncHandler(async (req, res) => {
    const { full_name, email, phone, password, role, business_name, business_address } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['full_name', 'email', 'password']);
    if (!validation.isValid) {
      const error = new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      const error = new Error('Invalid email format');
      error.statusCode = 400;
      throw error;
    }

    const validRoles = ['USER', 'VENDOR'];
    const userRole = role && validRoles.includes(role) ? role : 'USER';
    
    // Check if email already exists
    let exists;
    if (userRole === 'VENDOR') {
      exists = await Vendor.findOne({ where: { email } });
    } else {
      exists = await User.findOne({ where: { email } });
    }
    
    if (exists) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    
    if (userRole === 'VENDOR') {
      user = await Vendor.create({ 
        full_name, 
        email, 
        phone, 
        password: hashedPassword, 
        business_name, 
        business_address, 
        status: 'ACTIVE'
      });
    } else {
      user = await User.create({ 
        full_name, 
        email, 
        phone, 
        password: hashedPassword 
      });
    }
    
    sendSuccess(res, {
      user: { 
        id: user.id, 
        full_name: user.full_name, 
        email: user.email, 
        role: userRole 
      }
    }, `${userRole} account created successfully`, 201);
  }),

  /**
   * Get all users and vendors
   */
  getAllUsers: asyncHandler(async (req, res) => {
    const [users, vendors] = await Promise.all([
      User.findAll({ 
        attributes: ['id', 'full_name', 'email', 'phone', 'is_verified', 'is_active', 'createdAt'],
        order: [['createdAt', 'DESC']]
      }),
      Vendor.findAll({ 
        attributes: ['id', 'full_name', 'email', 'phone', 'business_name', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']]
      })
    ]);

    sendSuccess(res, { users, vendors }, 'Users retrieved successfully');
  }),

  /**
   * Get all vendors with pagination and optional filters
   */
  getVendors: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const offset = getPaginationOffset(page, limit);
    const { status, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { business_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await Vendor.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'full_name', 'email', 'phone', 'business_name', 'business_address', 'status', 'createdAt']
    });

    const pagination = {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + rows.length < count,
      hasPrev: page > 1
    };

    return sendPaginatedResponse(res, rows, pagination, 'Vendors retrieved successfully');
  }),



  /**
   * Get vendor by ID with details
   */
  getVendorById: asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findByPk(vendorId, {
      attributes: ['id', 'full_name', 'email', 'phone', 'business_name', 'business_address', 'status', 'createdAt', 'updatedAt']
    });
    
    if (!vendor) {
      const error = new Error('Vendor not found');
      error.statusCode = 404;
      throw error;
    }

    // Get vendor's hotels count
    const hotelsCount = await Hotel.count({ where: { vendor_id: vendorId } });

    sendSuccess(res, { 
      vendor: {
        ...vendor.toJSON(),
        hotelsCount
      }
    }, 'Vendor details retrieved successfully');
  }),

  /**
   * Get user by ID
   */
  getUserById: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'full_name', 'email', 'phone', 'is_verified', 'createdAt']
    });
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    sendSuccess(res, { user }, 'User details retrieved successfully');
  }),

  /**
   * Update user information
   */
  updateUser: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const { full_name, email, phone, is_verified } = req.body;
    const updateData = {};
    
    if (full_name) updateData.full_name = full_name;
    if (email) {
      if (!isValidEmail(email)) {
        const error = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
      }
      updateData.email = email;
    }
    if (phone) updateData.phone = phone;
    if (typeof is_verified === 'boolean') updateData.is_verified = is_verified;
    
    await user.update(updateData);
    sendSuccess(res, { user }, 'User updated successfully');
  }),

  /**
   * Delete user account
   */
  deleteUser: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    await user.destroy();
    sendSuccess(res, null, 'User deleted successfully');
  }),

  /**
   * Block/suspend user account
   */
  blockUser: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    await user.update({ is_verified: false });
    sendSuccess(res, null, 'User blocked successfully');
  }),

  /**
   * Unblock/activate user account
   */
  unblockUser: asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    await user.update({ is_verified: true });
    sendSuccess(res, null, 'User unblocked successfully');
  }),

  /**
   * Get users with pagination and optional filters
   */
  getUsersPaginated: asyncHandler(async (req, res) => {
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const offset = getPaginationOffset(page, limit);
    const { search, is_active, is_verified } = req.query;

    const where = {};
    if (typeof is_active !== 'undefined') where.is_active = String(is_active) === 'true';
    if (typeof is_verified !== 'undefined') where.is_verified = String(is_verified) === 'true';
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'full_name', 'email', 'phone', 'is_verified', 'is_active', 'createdAt']
    });

    const pagination = {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + rows.length < count,
      hasPrev: page > 1
    };

    return sendPaginatedResponse(res, rows, pagination, 'Users retrieved successfully');
  }),

  /**
   * Update user status flags (is_active, is_verified)
   */
  updateUserStatus: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { is_active, is_verified } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const updates = {};
    if (typeof is_active !== 'undefined') updates.is_active = Boolean(is_active);
    if (typeof is_verified !== 'undefined') updates.is_verified = Boolean(is_verified);

    if (Object.keys(updates).length === 0) {
      const error = new Error('Provide at least one of is_active or is_verified');
      error.statusCode = 400;
      throw error;
    }

    await user.update(updates);
    return sendSuccess(res, { user }, 'User status updated successfully');
  }),

  /**
   * Get all bookings of a specific user (admin scope) with pagination
   */
  getUserBookings: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = validatePagination(req.query.page, req.query.limit);
    const offset = getPaginationOffset(page, limit);
    const { status } = req.query;

    const where = { user_id: userId };
    if (status) where.status = status;

    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
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
   * Create vendor (simple)
   */
  createVendor: asyncHandler(async (req, res) => {
    const { full_name, email, phone, password, business_name, business_address, status } = req.body;

    // Basic validation
    const validation = validateRequiredFields(req.body, ['full_name', 'email', 'password']);
    if (!validation.isValid) {
      const err = new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    if (!isValidEmail(email)) {
      const err = new Error('Invalid email format');
      err.statusCode = 400;
      throw err;
    }

    // Unique email
    const exists = await Vendor.findOne({ where: { email } });
    if (exists) {
      const err = new Error('Email already exists');
      err.statusCode = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({
      full_name,
      email,
      phone,
      password: hashed,
      business_name,
      business_address,
      status: status || 'ACTIVE'
    });

    return sendSuccess(res, { vendor: {
      id: vendor.id,
      full_name: vendor.full_name,
      email: vendor.email,
      phone: vendor.phone,
      business_name: vendor.business_name,
      business_address: vendor.business_address,
      status: vendor.status,
      createdAt: vendor.createdAt
    } }, 'Vendor created successfully', 201);
  }),

  /**
   * Update vendor (simple)
   */
  updateVendor: asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      throw err;
    }

    const { full_name, email, phone, password, business_name, business_address, status } = req.body;

    // If changing email, ensure unique and valid
    if (email) {
      if (!isValidEmail(email)) {
        const err = new Error('Invalid email format');
        err.statusCode = 400;
        throw err;
      }
      const emailInUse = await Vendor.findOne({ where: { email, id: { [Op.ne]: vendor.id } } });
      if (emailInUse) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        throw err;
      }
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (business_name !== undefined) updates.business_name = business_name;
    if (business_address !== undefined) updates.business_address = business_address;
    if (status !== undefined) updates.status = status;
    if (password) updates.password = await bcrypt.hash(password, 10);

    await vendor.update(updates);

    return sendSuccess(res, { vendor: {
      id: vendor.id,
      full_name: vendor.full_name,
      email: vendor.email,
      phone: vendor.phone,
      business_name: vendor.business_name,
      business_address: vendor.business_address,
      status: vendor.status,
      updatedAt: vendor.updatedAt
    } }, 'Vendor updated successfully');
  }),

  /**
   * Activate vendor - Set status to ACTIVE
   */
  activateVendor: asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const vendor = await Vendor.findByPk(vendorId);
    
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      throw err;
    }

    if (vendor.status === 'ACTIVE') {
      const err = new Error('Vendor is already active');
      err.statusCode = 400;
      throw err;
    }

    await vendor.update({ status: 'ACTIVE' });

    return sendSuccess(res, { vendor: {
      id: vendor.id,
      full_name: vendor.full_name,
      email: vendor.email,
      phone: vendor.phone,
      business_name: vendor.business_name,
      business_address: vendor.business_address,
      status: vendor.status,
      updatedAt: vendor.updatedAt
    } }, 'Vendor activated successfully');
  }),

  /**
   * Deactivate/Suspend vendor - Set status to SUSPENDED
   */
  deactivateVendor: asyncHandler(async (req, res) => {
    const { vendorId } = req.params;
    const vendor = await Vendor.findByPk(vendorId);
    
    if (!vendor) {
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      throw err;
    }

    if (vendor.status === 'SUSPENDED') {
      const err = new Error('Vendor is already suspended');
      err.statusCode = 400;
      throw err;
    }

    await vendor.update({ status: 'SUSPENDED' });

    return sendSuccess(res, { vendor: {
      id: vendor.id,
      full_name: vendor.full_name,
      email: vendor.email,
      phone: vendor.phone,
      business_name: vendor.business_name,
      business_address: vendor.business_address,
      status: vendor.status,
      updatedAt: vendor.updatedAt
    } }, 'Vendor suspended successfully');
  }),

  // ============ HOTEL MANAGEMENT ============

  /**
   * Get all hotels with vendor information
   */
  getAllHotels: asyncHandler(async (req, res) => {
    const hotels = await Hotel.findAll({
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'email', 'business_name'] },
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms' }
      ],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { hotels }, 'Hotels retrieved successfully');
  }),

  /**
   * Get hotel by ID with full details
   */
  getHotelById: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'full_name', 'email', 'business_name'] },
        { model: HotelImage, as: 'images' },
        { model: Room, as: 'rooms' }
      ]
    });
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.statusCode = 404;
      throw error;
    }

    sendSuccess(res, { hotel }, 'Hotel details retrieved successfully');
  }),

  /**
   * Update hotel information
   */
  updateHotel: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.statusCode = 404;
      throw error;
    }
    
    await hotel.update(req.body);
    sendSuccess(res, { hotel }, 'Hotel updated successfully');
  }),

  /**
   * Delete hotel
   */
  deleteHotel: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.statusCode = 404;
      throw error;
    }
    
    await hotel.destroy();
    sendSuccess(res, null, 'Hotel deleted successfully');
  }),

  /**
   * Approve hotel for listing
   */
  approveHotel: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.statusCode = 404;
      throw error;
    }
    
    await hotel.update({ status: 'APPROVED' });
    sendSuccess(res, { hotel }, 'Hotel approved successfully');
  }),

  /**
   * Reject hotel application
   */
  rejectHotel: asyncHandler(async (req, res) => {
    const hotel = await Hotel.findByPk(req.params.hotelId);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.statusCode = 404;
      throw error;
    }
    
    await hotel.update({ status: 'REJECTED' });
    sendSuccess(res, { hotel }, 'Hotel rejected successfully');
  }),

  // ============ BOOKING MANAGEMENT ============

  /**
   * Get all bookings with user and hotel information
   */
  getAllBookings: asyncHandler(async (req, res) => {
    const bookings = await Booking.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
        { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'type', 'price'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { bookings }, 'Bookings retrieved successfully');
  }),

  /**
   * Get booking by ID with full details
   */
  getBookingById: asyncHandler(async (req, res) => {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
        { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
        { model: Room, as: 'room', attributes: ['id', 'type', 'price'] },
        { model: Payment, as: 'payment' }
      ]
    });
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }

    sendSuccess(res, { booking }, 'Booking details retrieved successfully');
  }),

  /**
   * Update booking information
   */
  updateBooking: asyncHandler(async (req, res) => {
    const booking = await Booking.findByPk(req.params.bookingId);
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }
    
    await booking.update(req.body);
    sendSuccess(res, { booking }, 'Booking updated successfully');
  }),

  /**
   * Cancel booking and restore room availability
   */
  cancelBooking: asyncHandler(async (req, res) => {
    const booking = await Booking.findByPk(req.params.bookingId);
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }
    
    await booking.update({ status: 'CANCELLED' });
    
    // Restore room availability
    const room = await Room.findByPk(booking.room_id);
    if (room) {
      await room.update({ available_rooms: room.available_rooms + 1 });
    }
    
    sendSuccess(res, { booking }, 'Booking cancelled successfully');
  }),

  // ============ ROOM MANAGEMENT ============

  /**
   * Get all rooms with hotel information
   */
  getAllRooms: asyncHandler(async (req, res) => {
    const rooms = await Room.findAll({
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, { rooms }, 'Rooms retrieved successfully');
  }),

  /**
   * Get room by ID with hotel details
   */
  getRoomById: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId, {
      include: [{ model: Hotel, as: 'hotel' }]
    });
    
    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }

    sendSuccess(res, { room }, 'Room details retrieved successfully');
  }),

  /**
   * Update room information
   */
  updateRoom: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId);
    
    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }
    
    await room.update(req.body);
    sendSuccess(res, { room }, 'Room updated successfully');
  }),

  /**
   * Delete room
   */
  deleteRoom: asyncHandler(async (req, res) => {
    const room = await Room.findByPk(req.params.roomId);
    
    if (!room) {
      const error = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }
    
    await room.destroy();
    sendSuccess(res, null, 'Room deleted successfully');
  }),

  // ============ DASHBOARD STATS ============

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats: asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalVendors,
      totalAdmins,
      totalHotels,
      totalBookings,
      totalRooms,
      pendingHotels,
      confirmedBookings
    ] = await Promise.all([
      User.count(),
      Vendor.count(),
      Admin.count(),
      Hotel.count(),
      Booking.count(),
      Room.count(),
      Hotel.count({ where: { status: 'PENDING' } }),
      Booking.count({ where: { status: 'CONFIRMED' } })
    ]);
    
    const stats = {
      totalUsers,
      totalVendors,
      totalAdmins,
      totalHotels,
      totalBookings,
      totalRooms,
      pendingHotels,
      confirmedBookings
    };

    sendSuccess(res, { stats }, 'Dashboard statistics retrieved successfully');
  })
};