// controllers/couponController.js
const { Coupon, Vendor } = require('../models');
const { Op, literal } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * @description Create a new coupon for the logged-in vendor
 */
const createCoupon = async (req, res) => {
  try {
    const vendor_id = req.user.id;
    const { code, type, value, expiry, usage_limit, active } = req.body;

    // Validate required fields
    if (!code || !type || !value) {
      return sendError(res, 'Code, type, and value are required', 400);
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (existingCoupon) {
      return sendError(res, 'Coupon code already exists', 400);
    }

    // Create coupon
    const coupon = await Coupon.create({
      vendor_id,
      code: code.toUpperCase(),
      type,
      value,
      expiry: expiry || null,
      usage_limit: usage_limit || 1,
      used_count: 0,
      active: active !== undefined ? active : true
    });

    return sendSuccess(res, 'Coupon created successfully', { coupon }, 201);
  } catch (err) {
    console.error('Error creating coupon:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Get all coupons for the logged-in vendor
 */
const getMyCoupons = async (req, res) => {
  try {
    const vendor_id = req.user.id;

    const coupons = await Coupon.findAll({
      where: { vendor_id },
      order: [['createdAt', 'DESC']]
    });

    return sendSuccess(res, 'Coupons retrieved successfully', { coupons, count: coupons.length });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Get a single coupon by ID (vendor-scoped)
 */
const getCouponById = async (req, res) => {
  try {
    const vendor_id = req.user.id;
    const { couponId } = req.params;

    const coupon = await Coupon.findOne({
      where: { id: couponId, vendor_id }
    });

    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    return sendSuccess(res, 'Coupon retrieved successfully', { coupon });
  } catch (err) {
    console.error('Error fetching coupon:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Update a coupon (vendor-scoped)
 */
const updateCoupon = async (req, res) => {
  try {
    const vendor_id = req.user.id;
    const { couponId } = req.params;
    const { code, type, value, expiry, usage_limit, active } = req.body;

    const coupon = await Coupon.findOne({
      where: { id: couponId, vendor_id }
    });

    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    // If code is being changed, check uniqueness
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
      if (existingCoupon) {
        return sendError(res, 'Coupon code already exists', 400);
      }
    }

    // Update coupon
    await coupon.update({
      code: code ? code.toUpperCase() : coupon.code,
      type: type || coupon.type,
      value: value !== undefined ? value : coupon.value,
      expiry: expiry !== undefined ? expiry : coupon.expiry,
      usage_limit: usage_limit !== undefined ? usage_limit : coupon.usage_limit,
      active: active !== undefined ? active : coupon.active
    });

    return sendSuccess(res, 'Coupon updated successfully', { coupon });
  } catch (err) {
    console.error('Error updating coupon:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Delete a coupon (vendor-scoped)
 */
const deleteCoupon = async (req, res) => {
  try {
    const vendor_id = req.user.id;
    const { couponId } = req.params;

    const coupon = await Coupon.findOne({
      where: { id: couponId, vendor_id }
    });

    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    await coupon.destroy();

    return sendSuccess(res, 'Coupon deleted successfully');
  } catch (err) {
    console.error('Error deleting coupon:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Get available coupons for a specific vendor (public for users)
 */
const getAvailableCoupons = async (req, res) => {
  try {
    const { vendor_id } = req.query;

    if (!vendor_id) {
      return sendError(res, 'vendor_id is required', 400);
    }

    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        vendor_id,
        active: true,
        expiry: { [Op.or]: [{ [Op.gt]: now }, null] },
        used_count: { [Op.lt]: literal('usage_limit') }
      },
      attributes: ['id', 'code', 'type', 'value', 'expiry', 'usage_limit', 'used_count']
    });

    return sendSuccess(res, 'Available coupons retrieved successfully', { coupons, count: coupons.length });
  } catch (err) {
    console.error('Error fetching available coupons:', err);
    return sendError(res, err.message, 500);
  }
};

/**
 * @description Apply/validate a coupon code
 */
const applyCoupon = async (req, res) => {
  try {
    const { code, amount, vendor_id } = req.body;

    if (!code) {
      return sendError(res, 'Coupon code is required', 400);
    }

    if (!vendor_id) {
      return sendError(res, 'vendor_id is required', 400);
    }

    const now = new Date();
    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        vendor_id,
        active: true,
        expiry: { [Op.or]: [{ [Op.gt]: now }, null] },
        used_count: { [Op.lt]: literal('usage_limit') }
      }
    });

    if (!coupon) {
      return sendError(res, 'Invalid, expired, or fully used coupon', 400);
    }

    // Calculate discount
    let discount_amount = 0;
    let total_after_discount = null;

    if (typeof amount === 'number' && amount > 0) {
      if (coupon.type === 'PERCENT') {
        discount_amount = (amount * coupon.value) / 100;
      } else {
        discount_amount = coupon.value;
      }
      discount_amount = Math.min(discount_amount, amount);
      total_after_discount = Math.max(0, amount - discount_amount);
    }

    return sendSuccess(res, 'Coupon applied successfully', {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      },
      discount: {
        input_amount: amount ?? null,
        discount_amount,
        total_after_discount
      }
    });
  } catch (err) {
    console.error('Error applying coupon:', err);
    return sendError(res, err.message, 500);
  }
};

module.exports = {
  createCoupon,
  getMyCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getAvailableCoupons,
  applyCoupon
};