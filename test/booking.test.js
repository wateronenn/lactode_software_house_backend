require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
jest.setTimeout(20000); // เพิ่มเวลาเป็น 20 วิ

let adminToken;
let ownerToken;
let owner2Token;
let userToken;

let hotelId;
let roomId;
let bookingId;
let userId;

// =======================
// 🔥 DATA GENERATOR
// =======================

const newHotel = () => ({
  name: `Hotel_${Date.now()}`,
  description: "Test hotel",
  location: "Bangkok",
  ownerID: "69da0c7ff8190a65bcf5db14", // owner
  tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
  email: `hotel${Date.now()}@mail.com`,
  district: "Watthana",
  province: "Bangkok",
  postalcode: "10110",
  region: "Central"
});

const newRoom = (hotelId) => ({
  hotelID: hotelId,
  roomType: "single",
  bedType: "queen",
  bed: 1,
  price: 1500,
  description: "Nice room",
  picture: ["https://example.com/room1.jpg"],
  facilities: ["wifi"],
  availableNumber: 5,
  status: "available",
  people: 2
});

const newBooking = (userId, hotelId, roomId) => ({
  hotelID: hotelId,
  user: userId,
  roomID: roomId,
  checkInDate: '2026-05-01',
  checkOutDate: '2026-05-05'
});

// =======================
// 🔥 SETUP
// =======================

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  // 🔐 login
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin1@gmail.com', password: '123456' });
  adminToken = adminRes.body.token;

  const ownerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner@gmail.com', password: '123456' });
  ownerToken = ownerRes.body.token;

  const owner2Res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner2@gmail.com', password: '123456' });
  owner2Token = owner2Res.body.token;

  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'user@gmail.com', password: '123456' });
  userToken = userRes.body.token;
  userId = userRes.body.user._id;

  // 🏨 create hotel
  const hotelRes = await request(app)
    .post('/api/v1/hotels')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newHotel());

  hotelId = hotelRes.body.data._id;

  // 🛏️ create room
  const roomRes = await request(app)
    .post(`/api/v1/hotels/${hotelId}/rooms`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(newRoom(hotelId));

  roomId = roomRes.body.data._id;
});

// =======================
// 🔥 CLEANUP
// =======================

afterAll(async () => {
  await request(app)
    .delete(`/api/v1/hotels/${hotelId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  await mongoose.connection.close();
});

// =======================
// 🧪 TEST
// =======================

describe('Booking API (Integration)', () => {

  // ===================
  // ✅ CREATE
  // ===================

  test('CREATE booking (user)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newBooking(userId, hotelId,roomId));

    expect(res.statusCode).toBe(201);
    bookingId = res.body.data._id;

    expect(res.body.user._id).toBe(userId);
  });

  // ===================
  // ✅ GET
  // ===================

 test('User sees only own bookings', async () => {
  const res = await request(app)
    .get('/api/v1/bookings')
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeInstanceOf(Array);

  res.body.data.forEach(booking => {
    expect(booking.user).toBeDefined();
    expect(booking.user._id).toBeDefined();
    expect(booking.user._id.toString()).toBe(userId.toString());
  });
});


test('Owner sees bookings in owned hotel', async () => {
  //1. get hotels ของ owner
  const hotelRes = await request(app)
    .get('/api/v1/hotels')
    .set('Authorization', `Bearer ${ownerToken}`);

  expect(hotelRes.statusCode).toBe(200);

  const ownerHotelIds = hotelRes.body.data.map(h => h._id.toString());

  //2. get bookings
  const res = await request(app)
    .get('/api/v1/bookings')
    .set('Authorization', `Bearer ${ownerToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeInstanceOf(Array);

  //3. check ทุก booking
  res.body.data.forEach(booking => {
    expect(ownerHotelIds).toContain(booking.hotelID.toString());
  });

  });

  const Booking = require('../models/Booking');

test('Admin sees all bookings', async () => {

  //จำนวน booking จริงใน DB
  const totalBookings = await Booking.countDocuments();

  //ยิง API
  const res = await request(app)
    .get('/api/v1/bookings')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeInstanceOf(Array);

  //เช็คว่าครบทุกอัน
  expect(res.body.data.length).toBe(totalBookings);

});

  // ===================
  // ❌ INVALID CREATE
  // ===================

  test('CREATE booking invalid hotelID', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(),
        hotelID: '123'
      });

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking invalid body', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking checkout < checkin', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        hotelID: hotelId,
        roomID: roomId,
        checkInDate: '2026-05-05',
        checkOutDate: '2026-05-01'
      });

    expect(res.statusCode).toBe(400);
  });

  // ===================
  // ❌ AUTHORIZATION
  // ===================

  test('User delete booking that not belong', async () => {
    const res = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${owner2Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('Owner delete booking not owned hotel', async () => {
    const res = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${owner2Token}`);

    expect(res.statusCode).toBe(403);
  });

  test('User get single booking not belong', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(403);
  });

    test('Admin can delete booking in owned hotel', async () => {
    const res = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

  test('User delete own booking', async () => {
    // สร้าง booking ใหม่
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newBooking());
    const newBookingId = createRes.body.data._id;

    // ลบ booking
    const res = await request(app)
      .delete(`/api/v1/bookings/${newBookingId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
      expect(res.statusCode).toBe(200);
  });

    test('Owner delete booking in owned hotel', async () => {
    // สร้าง booking ใหม่
        
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newBooking());
    const newBookingId = createRes.body.data._id;   

    // ลบ booking
    const res = await request(app)
      .delete(`/api/v1/bookings/${newBookingId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    
        expect(res.statusCode).toBe(200);

    });
});