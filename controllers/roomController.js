// controllers/roomController.js - DEPRECATED
// This controller has been replaced by role-specific controllers:
// - adminController.js for admin room management
// - vendorController.js for vendor/owner room management
// - userController.js for user room browsing

const { Room, Hotel } = require('../models');

// Legacy controller - use role-specific controllers instead
module.exports = {
  // DEPRECATED: Use vendorController.createRoom instead
  addRoom: async (req, res) => {
    try {
      const hotel = await Hotel.findByPk(req.params.hotelId);
      if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
      
      // This controller is deprecated - use role-specific controllers
      return res.status(410).json({ message: 'This endpoint is deprecated. Use role-specific endpoints instead.' });
      
      const { type, price, total_rooms, amenities } = req.body;
      if (!type || !price || !total_rooms) {
        return res.status(400).json({ message: 'Type, price, and total_rooms are required' });
      }
      
      const room = await Room.create({ 
        hotel_id: hotel.id,
        type,
        price,
        total_rooms,
        available_rooms: total_rooms,
        amenities: amenities ? JSON.stringify(amenities) : null
      });
      
      res.json({ 
        message: 'Room created successfully',
        room 
      });
    } catch (err) { 
      console.error(err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // DEPRECATED: Use vendorController.updateRoom or adminController.updateRoom instead
  updateRoom: async (req, res) => {
    try {
      const room = await Room.findByPk(req.params.roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      
      const hotel = await Hotel.findByPk(room.hotel_id);
      if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
      
      // This controller is deprecated - use role-specific controllers
      return res.status(410).json({ message: 'This endpoint is deprecated. Use role-specific endpoints instead.' });
      
      const { type, price, total_rooms, amenities } = req.body;
      const updateData = {};
      
      if (type) updateData.type = type;
      if (price) updateData.price = price;
      if (total_rooms) {
        updateData.total_rooms = total_rooms;
        // Adjust available rooms proportionally
        const currentAvailable = room.available_rooms;
        const currentTotal = room.total_rooms;
        const ratio = currentAvailable / currentTotal;
        updateData.available_rooms = Math.floor(total_rooms * ratio);
      }
      if (amenities) updateData.amenities = JSON.stringify(amenities);
      
      await room.update(updateData);
      res.json({ 
        message: 'Room updated successfully',
        room 
      });
    } catch (err) { 
      console.error(err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // DEPRECATED: Use vendorController.deleteRoom or adminController.deleteRoom instead
  deleteRoom: async (req, res) => {
    try {
      const room = await Room.findByPk(req.params.roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      
      const hotel = await Hotel.findByPk(room.hotel_id);
      if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
      
      // This controller is deprecated - use role-specific controllers
      return res.status(410).json({ message: 'This endpoint is deprecated. Use role-specific endpoints instead.' });
      
      // Check for active bookings
      const { Booking } = require('../models');
      const activeBookings = await Booking.count({
        where: {
          room_id: room.id,
          status: ['PENDING', 'CONFIRMED']
        }
      });
      
      if (activeBookings > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete room with active bookings' 
        });
      }
      
      await room.destroy();
      res.json({ message: 'Room deleted successfully' });
    } catch (err) { 
      console.error(err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // DEPRECATED: Use userController.getRoomsByHotel instead
  listRoomsByHotel: async (req, res) => {
    try {
      const hotel = await Hotel.findByPk(req.params.hotelId);
      if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
      
      // This controller is deprecated - use role-specific controllers
      return res.status(410).json({ message: 'This endpoint is deprecated. Use role-specific endpoints instead.' });
      
      const rooms = await Room.findAll({ 
        where: { hotel_id: req.params.hotelId },
        include: [{ 
          model: Hotel, 
          as: 'hotel', 
          attributes: ['id', 'name', 'status'] 
        }],
        order: [['price', 'ASC']]
      });
      
      res.json({ rooms });
    } catch (err) { 
      console.error(err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  }
};
