process.env.NODE_ENV = 'test';
require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
jest.setTimeout(20000);

let userToken;
let ownerToken;
let adminToken;

let hotelID1;
let hotelID2;
let hotelID3;
let invalidID = "invalid-id";
beforeAll( async ()=>{
    await mongoose.connect(process.env.MONGO_URL);

    const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin@gmail.com', password: '123456' });
  adminToken = adminRes.body.token;

  const ownerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner@gmail.com', password: '123456' });
  ownerToken = ownerRes.body.token;

    const userRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'user@gmail.com', password: '123456' });
    userToken = userRes.body.token;
    userID = userRes.body.user._id;

    await request(app)
    .delete('/api/v1/favorites')
    .set('Authorization', `Bearer ${userToken}`);

    const hotelRes = await request(app)
        .get('/api/v1/hotels')
        .set('Authorization', `Bearer ${userToken}`);
    
    hotelID1 = hotelRes.body.data[0]._id;
    hotelID2 = hotelRes.body.data[1]._id;
    hotelID3 = hotelRes.body.data[2]._id;

})

afterAll(async () => {

  await mongoose.connection.close();
});


describe('DELETE ALL /favorites', () => {

  it('remove favorite via API', async () => {
     await request(app)
    .post(`/api/v1/favorites/${hotelID1}`)
    .set('Authorization', `Bearer ${userToken}`);

  await request(app)
    .post(`/api/v1/favorites/${hotelID2}`)
    .set('Authorization', `Bearer ${userToken}`);

  await request(app)
    .post(`/api/v1/favorites/${hotelID3}`)
    .set('Authorization', `Bearer ${userToken}`);
    
    const res = await request(app)
      .delete(`/api/v1/favorites`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('All favorites removed');
  });

  it(' remove all with no favorite left via API', async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

});

describe('POST /favorites/:hotelID', () => {

  it('should add favorite via API', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${hotelID1}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data).toContain(hotelID1);
  });

   it('should add favorite via API', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${hotelID2}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toContain(hotelID2);
  });

  it('duplicate add favorite via API', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${hotelID1}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Invalid hotel ID add favorite via API', async () => {
    const res = await request(app)
      .post(`/api/v1/favorites/${123}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /favorites ', () => {

  it('USER GET favorite via API', async () => {
    const res = await request(app)
      .get(`/api/v1/favorites`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('OWNER GET favorite', async () => {
    const res = await request(app)
      .get(`/api/v1/hotels`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});



describe('DELETE /favorites/:hotelID', () => {

  it('remove favorite via API', async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${hotelID1}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('duplicate remove favorite via API', async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${hotelID1}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
   it('Invalid hotel ID remove favorite via API', async () => {
    const res = await request(app)
      .delete(`/api/v1/favorites/${123}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
});


describe('GET /favorites/compare', () => {

  it('should compare two hotels successfully', async () => {
     await request(app)
    .post(`/api/v1/favorites/${hotelID1}`)
    .set('Authorization', `Bearer ${userToken}`);

  await request(app)
    .post(`/api/v1/favorites/${hotelID2}`)
    .set('Authorization', `Bearer ${userToken}`);

  await request(app)
    .post(`/api/v1/favorites/${hotelID3}`)
    .set('Authorization', `Bearer ${userToken}`);

    const res = await request(app)
      .get(`/api/v1/favorites/compare`)
      .query({
        hotel1: hotelID1,
        hotel2: hotelID2
      })
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.data).toHaveProperty('hotel1');
    expect(res.body.data).toHaveProperty('hotel2');

    expect(res.body.data.hotel1).toHaveProperty('avgPrice');
    expect(res.body.data.hotel1).toHaveProperty('bestFor');
    expect(res.body.data.hotel1).toHaveProperty('summary');

    expect(res.body.data.hotel2).toHaveProperty('avgPrice');
    expect(res.body.data.hotel2).toHaveProperty('bestFor');
    expect(res.body.data.hotel2).toHaveProperty('summary');
  });

});