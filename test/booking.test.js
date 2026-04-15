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
  checkOutDate: '2026-05-02'
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

  const userRes2 = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'userr@gmail.com', password: '123456' });
  userToken2 = userRes2.body.token;
  userId2 = userRes2.body.user._id;

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
    expect(booking.user.toString()).toBe(userId.toString());
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
    expect(ownerHotelIds).toContain(booking.hotelID._id.toString());
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

test('User get single booking', async () => {
  const res = await request(app)
    .get(`/api/v1/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.data._id).toBe(bookingId);
});

  // ===================
  // ❌ INVALID GET(single)
  // ===================

  test('User get single booking not exist', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(404);
  });

  test('User get single booking invalid ID', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/123') // ID ที่ไม่ใช่ ObjectId
      .set('Authorization', `Bearer ${userToken}`); 
    expect(res.statusCode).toBe(400);
  });


  // ===================
  // ❌ INVALID CREATE
  // ===================

  test('CREATE booking invalid hotelID', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        hotelId: '123'
      });

    expect(res.statusCode).toBe(500);
  });

  test('CREATE booking no checkin date', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        checkInDate: undefined
      });

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking no checkout date', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        checkOutDate: undefined
      });

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking invalid date format', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        checkInDate: 'invalid-date',
        checkOutDate: 'invalid-date'
      });

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking exceed 3 days', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        checkInDate: '2026-05-01',
        checkOutDate: '2026-05-10'
      });

    expect(res.statusCode).toBe(400);
  });

  test('CREATE booking invalid room ID', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        roomID: '123'
      });

    expect(res.statusCode).toBe(500);
  });

  test('CREATE booking roomID not exist', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        ...newBooking(userId, hotelId, roomId),
        roomID: new mongoose.Types.ObjectId()
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
  // UPDATE BOOKING
  // ===================

  test('User update (valid)', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-02'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.checkInDate).toBe('2026-06-01T00:00:00.000Z');
    expect(res.body.data.checkOutDate).toBe('2026-06-02T00:00:00.000Z');
  });

  test('User update invalid date', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`) 
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        checkInDate: 'invalid-date',
        checkOutDate: 'invalid-date'
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('User update checkout < checkin', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        checkInDate: '2026-06-05',
        checkOutDate: '2026-06-01'
      });
    expect(res.statusCode).toBe(400);
  });

  test('User update booking exceed 3 days', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        checkInDate: '2026-06-01',
        checkOutDate: '2026-06-10'
      });
    expect(res.statusCode).toBe(400);
  });

  test('User update data not date', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userID:userId2,
      });
    expect(res.statusCode).toBe(400);
  });

  test('User update not belong booking', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken2}`)
      .send({ checkInDate: '2026-06-01', checkOutDate: '2026-06-02' });
    expect(res.statusCode).toBe(403);
  });

  test('Owner update booking in owned hotel', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ checkInDate: '2026-06-01', checkOutDate: '2026-06-02' });
    expect(res.statusCode).toBe(200);
  });

  test('Owner update booking not owned hotel', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${owner2Token}`)
      .send({ checkInDate: '2026-06-01', checkOutDate: '2026-06-02' });
    expect(res.statusCode).toBe(403);
  });

  test('Admin update booking', async () => {
    const res = await request(app)
      .put(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ checkInDate: '2026-06-01', checkOutDate: '2026-06-02' });
    expect(res.statusCode).toBe(200);
  });


  // ===================
  // ❌ DELETE
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
      .set('Authorization', `Bearer ${userToken2}`);

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
      .send(newBooking(userId, hotelId, roomId));
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
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(newBooking(userId, hotelId, roomId));
  const newBookingId = createRes.body.data._id;   

  // ลบ booking
  const res = await request(app)
    .delete(`/api/v1/bookings/${newBookingId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
  
      expect(res.statusCode).toBe(200);

  });

  test('Admin delete booking not exist', async () => {
    const res = await request(app)
      .delete(`/api/v1/bookings/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});