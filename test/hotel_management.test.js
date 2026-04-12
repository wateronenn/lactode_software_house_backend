require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let token;
let hotelId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'admin1@gmail.com',
      password: '123456'
    });

  token = res.body.token;
  console.log("Login Token:", token);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Hotel API (Integration)', () => {

  test('CREATE hotel', async () => {
    const res = await request(app)
      .post('/api/v1/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send({
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

    console.log("CREATE:", res.body);

    expect(res.statusCode).toBe(201);
    hotelId = res.body.data._id;
  });

  test('GET all hotels', async () => {
    const res = await request(app)
      .get('/api/v1/hotels');

    expect(res.statusCode).toBe(200);
  });

  test('GET single hotel', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels/${hotelId}`);

    expect(res.statusCode).toBe(200);
  });

  test('UPDATE hotel', async () => {
    const res = await request(app)
      .put(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Updated Integration Hotel" });

    expect(res.statusCode).toBe(200);
  });

  test('DELETE hotel', async () => {
    const res = await request(app)
      .delete(`/api/v1/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

});