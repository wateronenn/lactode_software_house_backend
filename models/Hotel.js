const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Please provide hotel name'],
      unique: true,
      minlength: [3, 'Hotel name must be at least 3 characters'],
      maxlength: [100, 'Hotel name cannot be more than 100 characters']
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Please provide location'],
      trim: true
    },

    // Owner Information
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hotel must have an owner'],
      validate: {
        isAsync: true,
        validator: async function(value) {
          const User = mongoose.model('User');
          const user = await User.findById(value);
          return user && user.role === 'hotelOwner';
        },
        message: 'Owner must be a hotel owner user'
      }
    },

    // Contact Information
    tel: {
    type: String,
    required: [true, 'Please provide phone number'],
    unique: true,
    trim: true,
    match: [/^(\d{10}|\d{9})$/, 'Please provide 9 or 10 digit phone number']
    },
    email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email'
    ]
    },

    // Address Information
    district: {
    type: String,
    required: [true, 'Please provide district'],
    trim: true
    },
    province: {
    type: String,
    required: [true, 'Please provide province'],
    trim: true
    },
    postalcode: {
    type: String,
    required: [true, 'Please provide postal code'],
    trim: true,
    match: [/^[0-9\-\s]{5,10}$/, 'Please provide a valid postal code']
    },
    region: {
    type: String,
    required: [true, 'Please provide region'],
    trim: true
    },

    // Pictures (URLs)
    pictures: {
      type: [String],
      default: [],
      validate: {
        validator: function(value) {
          return value.length <= 20; // Max 20 pictures
        },
        message: 'Hotel cannot have more than 20 pictures'
      }
    },

    // Rooms
    rooms: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Room',
      default: []
    },

    // Room Types offered (e.g., 'single', 'double', 'suite')
    roomTypes: {
      type: [String],
      default: [],
      validate: {
        validator: function(value) {
          return value.length <= 10; // Max 10 room types
        },
        message: 'Cannot have more than 10 different room types'
      }
    },

    // Facilities (e.g., 'wifi', 'parking', 'pool', 'gym')
    facilities: {
      type: [String],
      default: [],
      enum: {
        values: [
          'wifi',
          'parking',
          'pool',
          'gym',
          'restaurant',
          'bar',
          'spa',
          'laundry',
          'room_service',
          'air_conditioning',
          'heating',
          'concierge',
          'conference_room',
          'elevator',
          'garden',
          'library',
          'safe',
          'tv',
          'minibar',
          'kitchen'
        ],
        message: 'Invalid facility'
      }
    },

    status: {
      type: String,
      enum: {
        values: ['available', 'occupied', 'maintenance', 'reserved'],
        message: 'Invalid status'
      },
      default: 'available'
    },

    // Statistics
    favoriteBy: {
    type: Number,
    default: 0,
    min: [0, 'Favorite count cannot be negative']
    },
    bookedTimes: {
    type: Number,
    default: 0,
    min: [0, 'Booked times cannot be negative']
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Hotel', HotelSchema);