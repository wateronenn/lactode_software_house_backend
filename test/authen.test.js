require('dotenv').config({ path: './config/config.env' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
jest.setTimeout(20000); // เพิ่มเวลาเป็น 20 วิ

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
    await mongoose.connection.close();
});



let userToken;
let hotelOwnerToken;
let adminToken;

let userIdentifier;
let hotelOwnerIdentifier;
let adminIdentifier;

let userTel;
let hotelOwnerTel;
let adminTel;

describe('Authentication Tests', () => {

    //REGISTER

    test('register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}User`,
                firstname: 'Test',
                lastname: 'User',
                email: `${Date.now()}user@example.com`,
                tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
                role: 'user',
                password: 'password'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        userIdentifier = res.body.user.email;
        userTel = res.body.user.tel;
    });

    test('register a new hotelOwner', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}HotelOwner`,
                firstname: 'Test',
                lastname: 'HotelOwner',
                email: `${Date.now()}hotelowner@example.com`,
                tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
                role: 'hotelOwner',
                password: 'password'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        hotelOwnerIdentifier = res.body.user.email;
        hotelOwnerTel = res.body.user.tel;
    });

    test('register a new admin', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}Admin`,
                firstname: 'Test',
                lastname: 'Admin',
                email: `${Date.now()}admin@example.com`,
                tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
                role: 'admin',
                password: 'password'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        adminIdentifier = res.body.user.email;
        adminTel = res.body.user.tel;
    });

    //REGISER INVALID
    
    test('register with missing fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}User`,
                firstname: 'Test',
                email: `${Date.now()}user@example.com`,
                tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
                role: 'user',
                password: 'password'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });

    test('register with existing email', async () => { 
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}User`,
                firstname: 'Test',
                lastname: 'User',
                email: `user@gmail.com`,
                tel: `08${Math.floor(10000000 + Math.random()*90000000)}`,
                role: 'user',
                password: 'password'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });

    test('register with existing tel', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: `${Date.now()}User`,
                firstname: 'Test',
                lastname: 'User',
                email: `${Date.now()}user@example.com`,
                tel: '212-144-1150',
                role: 'user',
                password: 'password'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });

    //LOGIN

    test('login with registered user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${userIdentifier}`,
                password: 'password'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        userToken = res.body.token; // เก็บ token สำหรับใช้ในเทสถัดไป    
    });

    test('login with registered hotelOwner', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${hotelOwnerIdentifier}`,
                password: 'password'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        hotelOwnerToken = res.body.token;
    });

    test('login with registered admin', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${adminIdentifier}`,
                password: 'password'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        adminToken = res.body.token;
    });

    test('login with phone (user)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${userTel}`,
                password: 'password'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    //LOGIN INVALID

    test('Login with missing fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${userIdentifier}`
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
     });

    test('Login with wrong password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: `${userIdentifier}`,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message');
    });

    test('Login with non-existing user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: 'no-one@gmail.com',
                password: 'password'
            });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message');
    });

    //LOGOUT
    test('logout user', async () => {
        const res = await request(app)
            .get('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(200);
    });

    //UPDATE 
    test('update user profile', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                firstname: 'Updated',
                lastname: 'User',
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('firstname', 'Updated');
        expect(res.body.data).toHaveProperty('lastname', 'User');
    });

    //UPDATE INVALID

    test('update user profile (role)', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                role: 'admin'
            });
        expect(res.statusCode).toEqual(404);
    });

    //UPDATE INVALID
    test('update user password (wrong current password)', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword',
                rePassword: 'newpassword'
            });
        
        expect(res.statusCode).toEqual(404);
    });

    test('update user password (mismatched new passwords)', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                currentPassword: 'password',
                newPassword: 'newpassword',
                rePassword: 'differentpassword'
            });
        
        expect(res.statusCode).toEqual(404);
    });

    test('update user password (missing fields)', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                currentPassword: 'password',
                newPassword: 'newpassword'
            });

        expect(res.statusCode).toEqual(404);
    });

    //UPDATE PASSWORD (VALID)
    test('update user password', async () => {
        const res = await request(app)
            .put('/api/v1/auth/update-password')    
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                currentPassword: 'password',
                newPassword: 'newpassword',
                rePassword: 'newpassword'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message');
    });

});