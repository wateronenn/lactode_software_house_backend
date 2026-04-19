require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
jest.setTimeout(20000); // เพิ่มเวลาเป็น 20 วิ

let adminToken;
let ownerToken;
let ownerToken2;
let userToken;

let hotelID;
let roomId;
let hotelID2;
let roomId2;

let owerId;
let owerId2;

// =======================
//  DATA GENERATORS
// =======================

const newHotel = (ownerId) => ({
  name: `Hotel_${Date.now()}`,
  description: "Test hotel",
  location: "Bangkok",
  ownerID: ownerId,
  tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
  email: `hotel${Date.now()}@mail.com`,
  district: "Watthana",
  province: "Bangkok",
  postalcode: "10110",
  region: "Central"
});

const newRoom = (hotelID) => ({
  hotelID: hotelID,
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
  ownerID = ownerRes.body.user._id;
  
  const ownerRes2 = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner2@gmail.com', password: '123456' });
  ownerToken2 = ownerRes2.body.token;
  ownerID2 = ownerRes2.body.user._id;

  //user
  const userRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'user@gmail.com', password: '123456' });
  userToken = userRes.body.token;

  //create hotel
  const hotelRes = await request(app)
    .post('/api/v1/hotels')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newHotel(ownerID));
  hotelID = hotelRes.body.data._id;

  const hotelRes2 = await request(app)
    .post('/api/v1/hotels')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newHotel(ownerID2));
  hotelID2 = hotelRes2.body.data._id;

  const roomRes = await request(app)
    .post(`/api/v1/hotels/${hotelID}/rooms`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(newRoom(hotelID));
  roomId = roomRes.body.data._id;

  const roomRes2 = await request(app)
    .post(`/api/v1/hotels/${hotelID2}/rooms`)
    .set('Authorization', `Bearer ${ownerToken2}`)
    .send(newRoom(hotelID2));
  roomId2 = roomRes2.body.data._id;
});


afterAll(async () => {

  request(app)
    .delete(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  request(app)
    .delete(`/api/v1/hotels/${hotelID2}/rooms/${roomId2}`)
    .set('Authorization', `Bearer ${adminToken}`);

  request(app)
    .delete(`/api/v1/hotels/${hotelID}`)
    .set('Authorization', `Bearer ${adminToken}`);

  request(app)
    .delete(`/api/v1/hotels/${hotelID2}`)
    .set('Authorization', `Bearer ${adminToken}`);  

  await mongoose.connection.close();
});

// =======================
// 🧪 TEST
// =======================

describe('Room API (Integration)', () => {

  // ===================
  // ✅ GET ALL
  // ===================

  test('GET all rooms (admin)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('GET all rooms (user)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('GET all rooms (hotelOwner)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);

  });

  // ===================
  //  GET SINGLE
  // ===================

  test('GET single room', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('_id', roomId);
  });

  test('GET single room not belong to hotel', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms/${roomId2}`) // ID ที่ไม่ใช่ของโรงแรมนี้
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
  });

  test('GET single room not exist', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelID}/rooms/123456789012345678901234`) // ID ที่ไม่มีใน DB
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
  });

  // ===================
  // ✅ CREATE
  // ===================

  test('CREATE room (owner)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(newRoom(hotelID));

    expect(res.statusCode).toBe(201);
    roomId = res.body.data._id;
  });

  //** invalid */

  test('create room but hotel not found', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/123456789012345678901234/rooms`) // ID ที่ไม่มีใน DB
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(newRoom("123456789012345678901234"));

    expect(res.statusCode).toBe(404);
  });

  test('create room but not owner of hotel', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken2}`) // token ของเจ้าของโรงแรมอื่น
      .send(newRoom(hotelID));

    expect(res.statusCode).toBe(403);
  });



  // ===================
  // ❌ INVALID CREATE (wrong role)
  // ===================

  test('CREATE room (user fail)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(newRoom(hotelID));

    expect(res.statusCode).toBe(403);
  });

  test('CREATE room (admin fail)', async () => {
    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newRoom(hotelID));

    expect(res.statusCode).toBe(403);
  });

  // ===================
  // ❌ INVALID CREATE
  // ===================

  test('CREATE room missing required field', async () => {
    const badRoom = { ...newRoom(hotelID) };
    delete badRoom.roomType;

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  test('CREATE room invalid enum', async () => {
    const badRoom = {
      ...newRoom(hotelID),
      roomType: "invalidType"
    };

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  test('CREATE room invalid hotelID', async () => {
    const badRoom = newRoom(hotelID);

    const res = await request(app)
      .post(`/api/v1/hotels/123456789012345678901234/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(404);
  });

  test('CREATE room negative price', async () => {
    const badRoom = {
      ...newRoom(hotelID),
      price: -100
    };

    const res = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(badRoom);

    expect(res.statusCode).toBe(400);
  });

  // ===================
  // ✅ UPDATE
  // ===================

  test('UPDATE room (owner)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ price: 2000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('price',2000);
  });

  test('UPDATE room (user fail)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 999 });

    expect(res.statusCode).toBe(403);
  });

  test('UPDATE room (admin fail)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 999 });

    expect(res.statusCode).toBe(403);
  });

  test('UPDATE room not found', async () => {
    const fakeRoomId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${fakeRoomId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ price: 2000 });

    expect([400, 404]).toContain(res.statusCode);
  });

  test('UPDATE room not belong to hotel', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${roomId2}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ price: 2000 });

    expect(res.statusCode).toBe(400);
  });

  test('UPDATE room not owned hotel room (hotelOwner)', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${ownerToken2}`)
      .send({ price: 2000 });

    expect(res.statusCode).toBe(403);
  });

  // ===================
  // ✅ DELETE
  // ===================

 test('DELETE room (user fail)', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('DELETE room not exist', async () => {
    const fakeRoomId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelID}/rooms/${fakeRoomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('DELETE room but hotel not found', async () => {
    const fakehotelID = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/hotels/${fakehotelID}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('DELETE room not belong to hotel', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelID2}/rooms/${roomId2}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    
    expect(res.statusCode).toBe(403);
  });

  test('DELETE room (owner)', async () => {

    //create new room to delete
    const createRes = await request(app)
      .post(`/api/v1/hotels/${hotelID}/rooms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(newRoom(hotelID));
    const newRoomId = createRes.body.data._id;

    expect(createRes.statusCode).toBe(201);

    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelID}/rooms/${newRoomId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
  });

 

});