require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let adminToken;
let ownerToken;
let userToken;

let hotelId;
let roomId;

// =======================
//  DATA GENERATORS
// =======================

const newHotel = () => ({
  name: `Hotel_${Date.now()}`,
  description: "Test hotel",
  location: "Bangkok",
  ownerID: "69da0c7ff8190a65bcf5db14",
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
  picture: [
    "https://example.com/room1.jpg"
  ],
  facilities: ["wifi", "air_conditioning"],
  availableNumber: 5,
  status: "available",
  people: 2
});

// =======================
// SETUP / TEARDOWN
// =======================

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  //admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin1@gmail.com', password: '123456' });
  adminToken = adminRes.body.token;

  //owner
  const ownerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner@gmail.com', password: '123456' });
  ownerToken = ownerRes.body.token;

  //user
  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'user@gmail.com', password: '123456' });
  userToken = userRes.body.token;

  //create hotel
  const hotelRes = await request(app)
    .post('/api/v1/hotels')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newHotel());

  hotelId = hotelRes.body.data._id;
});

// afterAll(async () => {
//   // cleanup hotel
//   await request(app)
//     .delete(`/api/v1/hotels/${hotelId}`)
//     .set('Authorization', `Bearer ${adminToken}`);

//   await mongoose.connection.close();
// });

// =======================
// 🧪 TEST
// =======================

describe('Room API (Integration)', () => {

  // ===================
  // ✅ GET ALL
  // ===================

  test('GET all rooms (admin)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('GET all rooms (user)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
  });

  // ===================
  // ✅ CREATE
  // ===================

  test('CREATE room (owner)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(newRoom(hotelId));

    expect(res.statusCode).toBe(201);
    roomId = res.body.data._id;
  });

  // ===================
  // ❌ INVALID CREATE (wrong role)
  // ===================

  test('CREATE room (user fail)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(newRoom(hotelId));

    expect(res.statusCode).toBe(403);
  });

  test('CREATE room (admin fail)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newRoom(hotelId));

    expect(res.statusCode).toBe(403);
  });

  // ===================
  // ❌ INVALID CREATE
  // ===================

  test('CREATE room missing required field', async () => {
    const badRoom = { ...newRoom(hotelId) };
    delete badRoom.roomType;

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  test('CREATE room invalid enum', async () => {
    const badRoom = {
      ...newRoom(hotelId),
      roomType: "invalidType"
    };

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  test('CREATE room invalid hotelID', async () => {
    const badRoom = newRoom("123456789012345678901234");

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  test('CREATE room negative price', async () => {
    const badRoom = {
      ...newRoom(hotelId),
      price: -100
    };

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  // ===================
  // ✅ UPDATE
  // ===================

  test('UPDATE room (owner)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ price: 2000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('price',200);
  });

  test('UPDATE room (user fail)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 999 });

    expect(res.statusCode).toBe(403);
  });

  test('UPDATE room (admin fail)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 999 });

    expect(res.statusCode).toBe(403);
  });

  test('UPDATE room not found', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}/rooms/123456789012345678901234`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ price: 2000 });

    expect([400, 404]).toContain(res.statusCode);
  });

  // ===================
  // ✅ DELETE
  // ===================

 test('DELETE room (user fail)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('DELETE room (owner)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
  });

 

});