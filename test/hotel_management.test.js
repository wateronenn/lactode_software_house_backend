const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Hotel API with DB', () => {

  test('GET /hotels should return 200', async () => {
    const res = await request(app).get('/api/v1/hotels');

    expect(res.statusCode).toBe(200);
  });

});