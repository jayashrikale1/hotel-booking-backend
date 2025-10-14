// server.js
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // ✅ Stop Sequelize from altering tables on every start
    // This prevents duplicate keys like code_2, code_3, etc.
    await sequelize.sync({ alter: false, force: false });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
})();
