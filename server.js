// server.js
const app = require('./app');
const { sequelize } = require('./models');
const { DataTypes } = require('sequelize');

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // ✅ Controlled sync: enable ALTER via env only when needed
    const alter = String(process.env.DB_SYNC_ALTER || 'false').toLowerCase() === 'true';
    const force = String(process.env.DB_SYNC_FORCE || 'false').toLowerCase() === 'true';
    // Self-healing: ensure users.profile_photo exists before syncing
    try {
      const qi = sequelize.getQueryInterface();
      const table = await qi.describeTable('users');
      if (!table.profile_photo) {
        console.log('Adding missing column users.profile_photo');
        await qi.addColumn('users', 'profile_photo', {
          type: DataTypes.STRING,
          allowNull: true,
          after: 'address'
        });
      }
      const hotels = await qi.describeTable('hotels');
      if (!hotels.map_url) {
        console.log('Adding missing column hotels.map_url');
        await qi.addColumn('hotels', 'map_url', {
          type: DataTypes.STRING,
          allowNull: true,
          after: 'longitude'
        });
      }
      if (!hotels.hotel_features) {
        console.log('Adding missing column hotels.hotel_features');
        await qi.addColumn('hotels', 'hotel_features', {
          type: DataTypes.JSON,
          allowNull: true,
          after: 'amenities'
        });
      }
      const bookings = await qi.describeTable('bookings');
      if (!bookings.price_per_night) {
        console.log('Adding missing column bookings.price_per_night');
        await qi.addColumn('bookings', 'price_per_night', {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 0,
          after: 'amount'
        });
      }

      // Fix coupon vendor_id constraint
      try {
        const coupons = await qi.describeTable('coupons');
        if (coupons.vendor_id && coupons.vendor_id.allowNull === false) {
           console.log('Relaxing coupons.vendor_id constraint to allow NULL');
           await qi.changeColumn('coupons', 'vendor_id', {
               type: DataTypes.INTEGER.UNSIGNED,
               allowNull: true
           });
        }
      } catch (couponErr) {
         console.warn('Could not modify coupons table (might not exist yet):', couponErr.message);
      }
    } catch (e) {
      // Ignore describe/add errors; sync alter will attempt to fix
      console.warn('Schema check warning:', e.message);
    }
    await sequelize.sync({ alter, force });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
})();
