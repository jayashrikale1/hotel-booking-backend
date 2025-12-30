const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Booking API',
      version: '1.0.0',
      description: 'A comprehensive hotel booking system API with separate authentication for Users, Vendors, and Admins',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            full_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'vendor', 'admin'] },
            status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            full_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            department: { type: 'string' },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time' },
            role: { type: 'string', enum: ['ADMIN'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        Hotel: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            vendor_id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            pincode: { type: 'string' },
            country: { type: 'string' },
            latitude: { type: 'number', format: 'float' },
            longitude: { type: 'number', format: 'float' },
            map_url: { type: 'string', format: 'uri' },
            amenities: {
              oneOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'object', additionalProperties: true },
                { type: 'null' }
              ]
            },
            hotel_features: {
              oneOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'object', additionalProperties: true },
                { type: 'null' }
              ]
            },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            rating: { type: 'number', format: 'float' },
            total_rooms: { type: 'integer' },
            available_rooms: { type: 'integer' },
            ac_rooms: { type: 'integer' },
            non_ac_rooms: { type: 'integer' },
            base_price: { type: 'number', format: 'float' },
            ac_room_price: { type: 'number', format: 'float' },
            non_ac_room_price: { type: 'number', format: 'float' },
            check_in_time: { type: 'string' },
            check_out_time: { type: 'string' },
            cancellation_policy: { type: 'string' },
            gst_number: { type: 'string' },
            status: { type: 'string', enum: ['PENDING','APPROVED','REJECTED','INACTIVE'] },
            featured: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            hotel_id: { type: 'integer' },
            room_id: { type: 'integer' },
            check_in_date: { type: 'string', format: 'date' },
            check_out_date: { type: 'string', format: 'date' },
            guests: { type: 'integer' },
            total_amount: { type: 'number', format: 'float' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
            payment_status: { type: 'string', enum: ['pending', 'paid', 'refunded'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            hotel_id: { type: 'integer' },
            booking_id: { type: 'integer' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Coupon: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            type: { type: 'string', enum: ['FLAT', 'PERCENT'] },
            value: { type: 'number', format: 'float' },
            expiry: { type: 'string', format: 'date-time' },
            usage_limit: { type: 'integer' },
            used_count: { type: 'integer' },
            active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
        
      }
    }
  },
  apis: [
    path.resolve(__dirname, '../routes/*.js'),
    path.resolve(__dirname, '../controllers/*.js'),
    path.resolve(__dirname, '../app.js')
  ]
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
