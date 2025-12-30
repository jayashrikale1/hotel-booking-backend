// controllers/bookingController.js
const { Booking, Room, Payment, sequelize, Hotel, Coupon } = require('../models');
const { Op, literal } = require('sequelize');
const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RZP_KEY || '',
  key_secret: process.env.RZP_SECRET || ''
});

module.exports = {
  createBooking: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { hotel_id, room_id, room_type, check_in, check_out, guests, payment_method, coupon_code } = req.body;
      
      let price = 0;
      let vendor_id = 0;
      
      if (room_id) {
         // Legacy logic with Room model
         /*
          const room = await Room.findByPk(room_id, { transaction: t });
          if (!room) { await t.rollback(); return res.status(404).json({ message: 'Room not found' }); }
          if (room.available_rooms < 1) { await t.rollback(); return res.status(400).json({ message: 'No available rooms' }); }
          
          price = room.price;
          vendor_id = room.hotel_id ? (await Hotel.findByPk(room.hotel_id)).vendor_id : 0;
          
           // decrement availability
          room.available_rooms = room.available_rooms - 1;
          await room.save({ transaction: t });
          */
          // Force legacy requests to fail or redirect? For now, let's just error out if room_id is used but Room model is deprecated
           await t.rollback(); return res.status(400).json({ message: 'Room ID based booking is deprecated. Use hotel_id and room_type.' });
          
      } else if (room_type && hotel_id) {
          // New logic with Hotel model fields
          const hotel = await Hotel.findByPk(hotel_id, { transaction: t });
          if (!hotel) { await t.rollback(); return res.status(404).json({ message: 'Hotel not found' }); }
          
          vendor_id = hotel.vendor_id;
          
          if (room_type === 'AC') {
              if (hotel.ac_rooms < 1) { await t.rollback(); return res.status(400).json({ message: 'No available AC rooms' }); }
              price = parseFloat(hotel.ac_room_price);
              hotel.ac_rooms = hotel.ac_rooms - 1;
          } else if (room_type === 'NON_AC') {
              if (hotel.non_ac_rooms < 1) { await t.rollback(); return res.status(400).json({ message: 'No available Non-AC rooms' }); }
              price = parseFloat(hotel.non_ac_room_price);
              hotel.non_ac_rooms = hotel.non_ac_rooms - 1;
          } else {
               await t.rollback(); return res.status(400).json({ message: 'Invalid room type' });
          }
          
          await hotel.save({ transaction: t });
      } else {
          await t.rollback(); return res.status(400).json({ message: 'Either room_id or (hotel_id + room_type) is required' });
      }

      // calculate nights and amount (simple)
      const days = (new Date(check_out) - new Date(check_in)) / (1000*60*60*24);
      const nights = Math.max(1, Math.ceil(days));
      let baseAmount = price * nights;
      let discount_amount = 0;
      let applied_coupon_code = null;

      // If coupon provided, validate and compute discount
      if (coupon_code) {
        const now = new Date();
        const coupon = await Coupon.findOne({
          where: {
            code: coupon_code,
            active: true,
            expiry: { [Op.or]: [{ [Op.gt]: now }, null] },
            used_count: { [Op.lt]: literal('usage_limit') }
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (!coupon) {
          await t.rollback();
          return res.status(400).json({ message: 'Invalid or expired coupon' });
        }
        if (coupon.type === 'PERCENT') {
          discount_amount = (baseAmount * coupon.value) / 100;
        } else {
          discount_amount = coupon.value;
        }
        discount_amount = Math.min(discount_amount, baseAmount);
        applied_coupon_code = coupon.code;
      }

      const amount = Math.max(0, baseAmount - discount_amount);

      // create booking
      const booking = await Booking.create({
        user_id: req.user.id,
        vendor_id,
        hotel_id,
        room_id: room_id || null,
        room_type: room_type || null,
        check_in,
        check_out,
        guests: guests || 1,
        amount,
        coupon_code: applied_coupon_code,
        discount_amount,
        status: 'PENDING'
      }, { transaction: t });

      // create razorpay order (if using razorpay)
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `rcpt_${booking.id}`
      });

      // create payment record placeholder
      await Payment.create({
        booking_id: booking.id,
        gateway: 'RAZORPAY',
        gateway_payment_id: order.id,
        amount,
        status: 'INITIATED'
      }, { transaction: t });

      await t.commit();
      res.json({ booking, order });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  },

  completePayment: async (req, res) => {
    try {
      // This is a sample endpoint to update payment after gateway response
      const { booking_id, gateway_payment_id, status } = req.body;
      const payment = await Payment.findOne({ where: { booking_id } });
      if (!payment) return res.status(404).json({ message: 'Payment not found' });

      payment.gateway_payment_id = gateway_payment_id;
      payment.status = status === 'success' ? 'SUCCESS' : 'FAILED';
      await payment.save();

      const booking = await Booking.findByPk(booking_id);
      if (status === 'success') {
        booking.status = 'CONFIRMED';
        booking.payment_id = payment.gateway_payment_id;
        await booking.save();

        // increment coupon usage only on successful payment
        if (booking.coupon_code) {
          await Coupon.increment(
            { used_count: 1 },
            {
              where: {
                code: booking.coupon_code,
                used_count: { [Op.lt]: literal('usage_limit') }
              }
            }
          );
        }
      } else {
        booking.status = 'CANCELLED';
        await booking.save();

        // Restore room availability on failed payment
        if (booking.room_id) {
        //   const room = await Room.findByPk(booking.room_id);
        //   if (room) {
        //      room.available_rooms = room.available_rooms + 1;
        //      await room.save();
        //   }
        } else if (booking.room_type && booking.hotel_id) {
            const hotel = await Hotel.findByPk(booking.hotel_id);
            if (hotel) {
                if (booking.room_type === 'AC') {
                    hotel.ac_rooms = hotel.ac_rooms + 1;
                } else if (booking.room_type === 'NON_AC') {
                    hotel.non_ac_rooms = hotel.non_ac_rooms + 1;
                }
                await hotel.save();
            }
        }
      }
      res.json({ payment, booking });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  },

  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({ where: { user_id: req.user.id } });
      res.json({ bookings });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  },

  ownerBookings: async (req, res) => {
    try {
      const bookings = await Booking.findAll({ where: { vendor_id: req.user.id } });
      res.json({ bookings });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  },

  cancelBooking: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const booking = await Booking.findByPk(req.params.bookingId, { transaction: t });
      if (!booking) { await t.rollback(); return res.status(404).json({ message: 'Booking not found' }); }
      if (booking.user_id !== req.user.id && booking.vendor_id !== req.user.id) { await t.rollback(); return res.status(403).json({ message: 'Not allowed' }); }
      if (booking.status === 'CANCELLED') { await t.rollback(); return res.status(400).json({ message: 'Already cancelled' }); }

      booking.status = 'CANCELLED';
      await booking.save({ transaction: t });

      // restore room availability
      if (booking.room_id) {
        // const room = await Room.findByPk(booking.room_id, { transaction: t });
        // if (room) {
        //   room.available_rooms = room.available_rooms + 1;
        //   await room.save({ transaction: t });
        // }
      } else if (booking.room_type && booking.hotel_id) {
        const hotel = await Hotel.findByPk(booking.hotel_id, { transaction: t });
        if (hotel) {
          if (booking.room_type === 'AC') {
            hotel.ac_rooms = hotel.ac_rooms + 1;
          } else if (booking.room_type === 'NON_AC') {
            hotel.non_ac_rooms = hotel.non_ac_rooms + 1;
          }
          await hotel.save({ transaction: t });
        }
      }

      await t.commit();
      res.json({ booking });
    } catch (err) {
      await t.rollback();
      console.error(err); res.status(500).json({ message: err.message });
    }
  }
};