const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser')
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
dotenv.config({path : './config/config.env'});

connectDB();

const limiter = rateLimit({
    windowMs : 10*60*1000, //10 mins,
    max : 10000
});

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());

app.set('query parser','extended');

const PORT = process.env.PORT || 5000; //change to 5003 in macOS
const server  = app.listen(PORT,console.log('Server is running in : ', process.env.NODE_ENV,' mode_on_port : ', PORT));

process.on('unhandledRejection', ( err,promise) => {
    console.log(`Error:${err.message}`);
    server.close(()=>process.exit(1));
})
