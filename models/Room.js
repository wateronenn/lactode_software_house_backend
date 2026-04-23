const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    // Hotel Reference
    hotelID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Room must belong to a hotel'],
      validate: {
        isAsync: true,
        validator: async function(value) {
          const Hotel = mongoose.model('Hotel');
          return !!(await Hotel.findById(value));
        },
        message: 'Hotel not found'
      }
    },

    // Room Type & Specifications
    roomType: {
      type: String,
      required: [true, 'Please provide room type'],
      enum: {
        values: ['single', 'double', 'twin', 'suite', 'deluxe', 'family', 'studio'],
        message: 'Invalid room type'
      },
      trim: true
    },

    // Bed Information
    bedType: {
      type: String,
      required: [true, 'Please provide bed type'],
      enum: {
        values: ['single', 'double', 'queen', 'king', 'twin'],
        message: 'Invalid bed type'
      }
    },
    //เพิ่ม bedCount 
    bed: {
      type: Number,
      required: [true, 'Please provide number of beds'],
      min: [1, 'Must have at least 1 bed'],
      max: [5, 'Cannot have more than 5 beds']
    },  

    // Pricing
    price: {
      type: Number,
      required: [true, 'Please provide room price'],
      min: [0, 'Price cannot be negative']
    },

    // Description & Details
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },

    // Pictures (URLs)
    picture: {
      type: [String],
      default: [],
      validate: {
        validator: function(value) {
          return value.length <= 10; // Max 10 pictures per room
        },
        message: 'Cannot have more than 10 pictures per room'
      }
    },

    // Facilities (specific to this room)
    facilities: {
      type: [String],
      default: [],
      enum: {
        values: [
          'wifi',
          'air_conditioning',
          'heating',
          'tv',
          'minibar',
          'safe',
          'bathroom',
          'balcony',
          'kitchen',
          'shower',
          'bathtub',
          'hairdryer',
          'iron',
          'desk',
          'sofa',
          'telephone',
          'coffee_maker',
          'dining_area',
          'work_area',
          'room_service'
        ],
        message: 'Invalid facility'
      }
    },

    // Availability
    availableNumber: {
      type: Number,
      required: [true, 'Please provide available number'],
      min: [0, 'Available number cannot be negative']
    },
    bookedNumber: {
      type: Number,
      default: 0,
      min: [0, 'Booked number cannot be negative']
    },
    // Room Status
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied', 'maintenance', 'reserved'],
        message: 'Invalid status'
      },
      default: 'available'
    },

    people:{
        type: Number,
        required: [true, 'Please provide number of people the room can accommodate'],
        min: [1, 'Must accommodate at least 1 person'],
    }


  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
RoomSchema.virtual('available').get(function() {
  return this.availableNumber - (this.bookedNumber ?? 0);
});

module.exports = mongoose.model('Room', RoomSchema);