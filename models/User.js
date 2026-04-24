const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required:[true,'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    tel: {
        type: String,
        unique: true,
        required: [true, 'Please add a phone number'],
        match: [/^(\d{3}-\d{3}-\d{4}|\d{2}-\d{3}-\d{4})$/, 'Please use format xxx-xxx-xxxx or xx-xxx-xxxx']
    },
    firstname: {
        type: String,
        required: [true, 'Please add a firstname'],
        trim: true
    },
    lastname: {
        type: String,
        required: [true, 'Please add a lastname'],
        trim: true
    },
    role: {
        type:String,
        enum: ['user','admin','hotelOwner'],
        default: 'user'
    },
    password: {
        type:String,
        required:[true,'Please add a password'],
        minlength: 6,
        select:false
    },
    picture : {
        type: String,
        default: 'https://drive.google.com/uc?export=view&id=1lB7fw5c1ZdP_Xb3TGQg4M2JGyfYP-y6O'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    favoriteHotels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel'
    }]
});

//Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  console.log('pre save triggered, isModified password:', this.isModified('password'));
  console.log('calling route or operation:', this);
  
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    });
}

//Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', UserSchema);