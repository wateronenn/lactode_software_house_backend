require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let adminToken;
let ownerToken;
let ownerToken2;    
let userToken;
let hotelId;

// 🔥 reusable hotel body
const newRandomHotel = () => ({
  name: `Hotel_${Date.now()}`,
  description: "simple description",
  location: "Sukhumvit Road, Bangkok",

  ownerID: "69da0c7ff8190a65bcf5db14",

  tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
  email: `test${Date.now()}@mail.com`,

  district: "Watthana",
  province: "Bangkok",
  postalcode: "10110",
  region: "Central",

  pictures: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],

  roomTypes: ["single", "double", "suite"],

  facilities: [
    "wifi",
    "parking",
    "pool",
    "gym",
    "restaurant",
    "spa",
    "air_conditioning"
  ],

  status: "available"
});

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  // 🔐 login admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'admin1@gmail.com',
      password: '123456'
    });

  adminToken = adminRes.body.token;

  // 🔐 login owner
  const ownerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'owner@gmail.com',
      password: '123456'
    });

  ownerToken = ownerRes.body.token;

  const ownerRes2 = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'owner2@gmail.com',
      password: '123456'
    });

  ownerToken2 = ownerRes2.body.token;

  // 🔐 login user (ใช้ same account ตามที่คุณให้)
  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'user@gmail.com',
      password: '123456'
    });

  userToken = userRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Hotel API (Integration Advanced)', () => {

  // ✅ CREATE (admin only)
  test('CREATE hotel (admin)', async () => {
    const res = await request(app)
      .post('/api/v1/hotels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newRandomHotel());

    expect(res.statusCode).toBe(201);
    hotelId = res.body.data._id;
  });

  // ❌ CREATE (hotelOwner → 403)
  test('CREATE hotel (hotelOwner should fail)', async () => {
    const res = await request(app)
      .post('/api/v1/hotels')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(newRandomHotel());

    expect(res.statusCode).toBe(403);
  });

  // ❌ CREATE (user → 403)
  test('CREATE hotel (user should fail)', async () => {
    const res = await request(app)
      .post('/api/v1/hotels')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newRandomHotel());

    expect(res.statusCode).toBe(403);
  });

  // ✅ GET ALL
  test('GET all hotels', async () => {
    const res = await request(app).get('/api/v1/hotels');
    expect(res.statusCode).toBe(200);
  });

  // ✅ GET SINGLE
  test('GET single hotel', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelId}`);

    expect(res.statusCode).toBe(200);
  });

  // ❌ GET INVALID ID
  test('GET single hotel invalid id', async () => {
    const res = await request(app)
      .get('/api/v1/hotels/123');

    expect(res.statusCode).toBe(400);
  });

  // ✅ UPDATE (admin)
  test('UPDATE hotel (admin)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: "Updated Hotel" });

    expect(res.statusCode).toBe(200);
  });

  // ❌ UPDATE (user → 403)
  test('UPDATE hotel (user should fail)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: "Hacked Hotel" });

    expect(res.statusCode).toBe(403);
  });

  // ❌ UPDATE (owner but not owner → 403)
  test('UPDATE hotel (owner but not real owner)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${ownerToken2}`)
      .send({ name: "Fake Owner Update" });

    expect(res.statusCode).toBe(403);
  });

  // ❌ DELETE (user → 403)
  test('DELETE hotel (user should fail)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  // ❌ DELETE (owner → 403)
  test('DELETE hotel (owner should fail)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(403);
  });

  // ✅ DELETE (admin)
  test('DELETE hotel (admin)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

});