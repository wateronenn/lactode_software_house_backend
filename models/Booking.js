const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    // User Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be associated with a user']
    },

    // Hotel Information
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Booking must be associated with a hotel']
    },

    // Room Information
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Booking must be associated with a room']
    },

    // Booking Dates
    checkInDate: {
      type: Date,
      required: [true, 'Please provide check-in date']
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Please provide check-out date'],
      validate: {
        validator: function() {
          return this.checkOutDate > this.checkInDate;
        },
        message: 'Check-out date must be after check-in date'
      }
    },

    // Number of Guests
    numberOfGuests: {
      type: Number,
      required: [true, 'Please provide number of guests'],
      min: [1, 'Minimum 1 guest required'],
      max: [10, 'Maximum 10 guests allowed']
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


module.exports = mongoose.model('Booking', BookingSchema);