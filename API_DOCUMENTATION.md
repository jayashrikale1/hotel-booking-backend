# OYO Backend API – One-File Documentation

Last updated: 2025-10-06

This is the single source of truth for all API endpoints. Use it to integrate the backend into your React app.


## Base Info

- Base URL (dev): http://localhost:3001
- Health: GET `/` → { message, version, status }
- Swagger UI (detailed schemas): GET `/api-docs`
- Static files (uploaded images): `/uploads/*`
- Version: 2.0.0


## Authentication

- All protected endpoints use Bearer JWT in the Authorization header.
- Header format: `Authorization: Bearer <token>`
- Roles: `ADMIN`, `VENDOR` (aka OWNER), `USER`
- You obtain tokens by logging in via role-specific auth endpoints.

Example login + authorized call (fetch):
```js
// Login (User)
const loginRes = await fetch('http://localhost:3001/api/user/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'secret' })
});
const { token } = await loginRes.json();

// Authorized request
const hotelsRes = await fetch('http://localhost:3001/api/user/hotels', {
  headers: { Authorization: `Bearer ${token}` }
});
```


## Public API (No auth required)
Mounted at `/api/public` (see `routes/publicApi.js`)

- GET `/api/public/hotels` → List approved hotels
- GET `/api/public/hotels/search` → Search hotels (query: city, checkin, checkout, ...)
- GET `/api/public/hotels/:hotelId` → Hotel details
- GET `/api/public/hotels/:hotelId/rooms` → Rooms for a hotel
- GET `/api/public/rooms/:roomId` → Room details
- GET `/api/public/amenities` → Static amenities list
- GET `/api/public/cities` → Static cities list
- GET `/api/public/room-types` → Static room types list
- GET `/api/public/health` → Public API health


## Role-specific Authentication

### Admin Auth – `/api/admin/auth` (see `routes/adminAuth.js`)
- POST `/register` [ADMIN token required] → Create another admin
- POST `/login` → Admin login, returns token
- POST `/forgot` → Start forgot-password flow
- POST `/change-password` [ADMIN] → Change own password
- POST `/reset-password` → Reset via token
- POST `/logout` [ADMIN] → Invalidate/logout

### Vendor Auth – `/api/vendor/auth` (see `routes/vendorAuth.js`)
- POST `/login` → Vendor login, returns token
- POST `/forgot-password` → Start forgot-password
- POST `/change-password` [VENDOR] → Change own password
- POST `/reset-password` → Reset via token

### User Auth – `/api/user/auth` (see `routes/userAuth.js`)
- POST `/register` → Create user
- POST `/login` → User login, returns token
- POST `/forgot-password` → Start forgot-password
- POST `/change-password` [USER] → Change own password
- POST `/reset-password` → Reset via token


## User API – `/api/user` (auth required) (see `routes/userApi.js`)
Allowed roles: `USER`, `OWNER`, `VENDOR`, `ADMIN` (as per middleware).

- GET `/hotels` → List hotels
- GET `/hotels/search` → Search hotels (query: city, checkin, checkout, ...)
- GET `/hotels/:hotelId` → Hotel details
- GET `/hotels/:hotelId/rooms` → Rooms for a hotel
- GET `/rooms/:roomId` → Room details

Bookings
- POST `/bookings` → Create booking { hotel_id, room_id, check_in_date, check_out_date, guests }
- GET `/bookings` → My bookings
- GET `/bookings/:bookingId` → Booking details
- POST `/bookings/:bookingId/cancel` → Cancel booking

Reviews
- POST `/reviews` → Create review { hotel_id, booking_id, rating, comment }
- GET `/reviews` → My reviews
- PUT `/reviews/:reviewId` → Update my review
- DELETE `/reviews/:reviewId` → Delete my review

Profile
- GET `/profile` → My profile
- PUT `/profile` → Update profile { full_name?, phone? }

Payments & Coupons (placeholders implemented in routes)
- POST `/payments/initiate` → Initiate payment for booking { booking_id, amount }
- GET `/payments` → List my payments
- GET `/payments/:paymentId` → Payment details
- POST `/coupons/apply` → Apply coupon { coupon_code, booking_id }

Wishlist (placeholders)
- POST `/wishlist/hotels/:hotelId` → Add hotel to wishlist
- DELETE `/wishlist/hotels/:hotelId` → Remove hotel from wishlist
- GET `/wishlist` → Get my wishlist


## Vendor API – `/api/vendor` (auth required) (see `routes/vendorApi.js`)
Allowed roles: `OWNER`, `VENDOR`, `ADMIN`.

Public (no auth, but mounted under vendor router)
- GET `/public/hotels` → Public list of approved hotels with details

Hotels
- POST `/hotels` [VENDOR] → Create hotel
- GET `/hotels` [VENDOR] → My hotels
- GET `/hotels/:hotelId` → My hotel details
- PUT `/hotels/:hotelId` → Update my hotel
- DELETE `/hotels/:hotelId` → Delete my hotel

Hotel Images
- POST `/hotels/:hotelId/images` → Upload images (multipart, field: images[])
- DELETE `/images/:imageId` → Delete image

Rooms
- POST `/hotels/:hotelId/rooms` → Create room
- GET `/hotels/:hotelId/rooms` → Rooms for my hotel
- GET `/rooms` → All my rooms
- GET `/rooms/:roomId` → Room details
- PUT `/rooms/:roomId` → Update room
- DELETE `/rooms/:roomId` → Delete room
- PUT `/rooms/:roomId/availability` → Update availability (placeholder)
- PUT `/rooms/:roomId/pricing` → Update pricing (placeholder)

Bookings
- GET `/bookings` → My bookings
- GET `/bookings/:bookingId` → Booking details
- PUT `/bookings/:bookingId/status` → Update booking status
- GET `/users/:userId/bookings` → Bookings of a user (scoped to current vendor)

Analytics & Reports
- GET `/dashboard/stats` → Stats summary
- GET `/reports/revenue` → Revenue report (query: start_date, end_date)
- GET `/reports/bookings` → Booking report (placeholder)
- GET `/reports/occupancy` → Occupancy report (placeholder)
- GET `/reports/financial` → Financial report (placeholder)

Coupons (placeholders)
- GET `/coupons` → My coupons
- POST `/coupons` → Create coupon
- PUT `/coupons/:couponId` → Update coupon
- DELETE `/coupons/:couponId` → Delete coupon


## Admin API – `/api/admin` (auth required) (see `routes/adminApi.js`)
Allowed roles: `ADMIN` only.

Users
- POST `/users` → Create user
- GET `/users/paginated` → List users with pagination & filters
- GET `/users` → All users
- GET `/users/:userId` → User by ID
- PUT `/users/:userId` → Update user
- PATCH `/users/:userId/status` → Update is_active / is_verified
- DELETE `/users/:userId` → Delete user
- POST `/users/:userId/block` → Block user
- POST `/users/:userId/unblock` → Unblock user
- GET `/users/:userId/bookings` → Bookings for a user (paginated)

Vendors
- GET `/vendors` → List vendors (pagination & filters)
- POST `/vendors` → Create vendor
- PUT `/vendors/:vendorId` → Update vendor
- POST `/vendors/:vendorId/activate` → Set status ACTIVE
- POST `/vendors/:vendorId/deactivate` → Set status SUSPENDED

Hotels
- GET `/hotels` → All hotels
- GET `/hotels/:hotelId` → Hotel by ID
- PUT `/hotels/:hotelId` → Update hotel
- DELETE `/hotels/:hotelId` → Delete hotel
- POST `/hotels/:hotelId/approve` → Approve
- POST `/hotels/:hotelId/reject` → Reject

Rooms
- GET `/rooms` → All rooms
- GET `/rooms/:roomId` → Room by ID
- PUT `/rooms/:roomId` → Update room
- DELETE `/rooms/:roomId` → Delete room

Bookings
- GET `/bookings` → All bookings
- GET `/bookings/:bookingId` → Booking by ID
- PUT `/bookings/:bookingId` → Update booking
- POST `/bookings/:bookingId/cancel` → Cancel booking

Analytics
- GET `/dashboard/stats` → System dashboard stats

Coupons (placeholders)
- POST `/coupons` → Create coupon
- GET `/coupons` → List coupons
- PUT `/coupons/:couponId` → Update coupon
- DELETE `/coupons/:couponId` → Delete coupon

Reviews (placeholders)
- GET `/reviews` → List reviews
- PUT `/reviews/:reviewId/moderate` → Moderate review
- DELETE `/reviews/:reviewId` → Delete review

Payments (placeholders)
- GET `/payments` → List payments
- GET `/payments/:paymentId` → Payment details


## Error Format & Status Codes

- Success: 200 OK, 201 Created are typical.
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server).
- Response shapes are standardized via backend helpers; expect JSON `{ success, message, data? }` or payloads per endpoint.


## Notes for React Integration

- Always include `Content-Type: application/json` when sending JSON.
- For file uploads (hotel images), use `multipart/form-data` with field name `images` (array).
- Keep and reuse the JWT token in your app state (e.g., Redux/Context). Add it to `Authorization` header for protected routes.
- Public browsing is available under `/api/public/*` without tokens.


## Deprecated/Legacy

- Some legacy routes exist (e.g., in `routes/rooms.js` and `routes/bookings.js`) but are marked deprecated. Prefer the role-specific routes above.
