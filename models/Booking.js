const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingID: {
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
    hotelID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Booking must be associated with a hotel']
    },

    // Room Information
    roomID: {
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