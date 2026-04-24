require('dotenv').config({ path: './config/config.env' });

const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const User = require('./models/User');

// =======================
// ENUMS
// =======================
const hotelFacilities = [
  'wifi', 'parking', 'pool', 'gym', 'restaurant', 'bar', 'spa', 'laundry',
  'room_service', 'air_conditioning', 'heating', 'concierge', 'conference_room',
  'elevator', 'garden', 'library', 'safe', 'tv', 'minibar', 'kitchen'
];

const roomFacilities = [
  'wifi', 'air_conditioning', 'heating', 'tv', 'minibar', 'safe', 'bathroom',
  'balcony', 'kitchen', 'shower', 'bathtub', 'hairdryer', 'iron', 'desk',
  'sofa', 'telephone', 'coffee_maker', 'dining_area', 'work_area', 'room_service'
];

const bedTypes = ['single', 'double', 'queen', 'king', 'twin'];
const roomTypes = ['single', 'double', 'suite', 'deluxe', 'family', 'studio', 'twin'];

const provinces = [
  'Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Chonburi',
  'Pattaya', 'Hua Hin', 'Koh Samui', 'Phi Phi', 'Railay'
];

const districts = {
  Bangkok: ['Silom', 'Pratunam', 'Ratchaprasong', 'Sukhumvit', 'Chinatown'],
  'Chiang Mai': ['Nimman', 'Old City', 'Riverside', 'Night Bazaar'],
  Phuket: ['Patong', 'Kathu', 'Karon', 'Bang Tao'],
  Krabi: ['Ao Nang', 'Krabi Town', 'Railay', 'Khlong Muang'],
  Chonburi: ['Pattaya', 'Bang Saen', 'Sattahip'],
  Pattaya: ['Central Pattaya', 'North Pattaya', 'South Pattaya'],
  'Hua Hin': ['Downtown', 'Cha-am'],
  'Koh Samui': ['Chaweng', 'Lamai', 'Maenam'],
  'Phi Phi': ['Phi Phi Don', 'Phi Phi Leh'],
  Railay: ['East Railay', 'West Railay']
};

const regions = ['Central', 'Northern', 'Southern', 'Eastern'];

// Sample hotel names for Thailand
const hotelNames = [
  'MD BROTHER RESTAURANT AND HOTEL',
  'Bangkok Paradise Hotel',
  'Chiang Mai Heritage Resort',
  'Phuket Beach Club',
  'Krabi Cliff View Hotel',
  'Royal Thai Palace Hotel',
  'Marina Bay Resort',
  'Sunset Grove Hotel',
  'Elephant Park Lodge',
  'Golden Dragon Hotel',
  'Emerald City Resort',
  'Riverside Mansion',
  'Twin Peaks Resort',
  'Temple View Hotel',
  'Oceanside Paradise',
  'Lush Garden Resort',
  'Diamond Luxury Hotel',
  'Bamboo Forest Lodge',
  'Starlight Boutique Hotel',
  'Phoenix Rising Hotel',
  'Azure Dreams Resort',
  'Silk Road Hotel',
  'Tropics Wellness Resort',
  'Urban Escape Hotel',
  'Nature\'s Retreat',
  'Celestial Comfort Hotel',
  'Heritage Premium Resort',
  'Crystal Valley Hotel',
  'Harmony Beach Resort',
  'Pinnacle Luxury Hotel'
];

// =======================
// HELPERS
// =======================
const randomPick = (arr, count = 5) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generatePhoneNumber = () => {
  return `08${Math.floor(10000000 + Math.random() * 90000000)}`;
};

const generatePostalCode = () => {
  return String(Math.floor(10000 + Math.random() * 90000));
};

// =======================
// CONNECT DB
// =======================
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ MongoDB Connected');
};

// =======================
// SEED FUNCTION
// =======================
const seedData = async () => {
  try {
    // ❗ Clear old data first
    await Hotel.deleteMany();
    await Room.deleteMany();

    const hotels = [];
    const rooms = [];

    // Fixed ownerID (you can change this to a real owner ID)
    const ownerID = new mongoose.Types.ObjectId('69e49162ce5281ee554d33d5');

    for (let i = 0; i < 30; i++) {
      const hotelID = new mongoose.Types.ObjectId();
      const province = getRandomElement(provinces);
      const districtList = districts[province] || [province];
      const district = getRandomElement(districtList);
      const region = getRandomElement(regions);

      // Create hotel
      const hotel = {
        _id: hotelID,
        name: hotelNames[i],
        description: `Experience the finest hospitality at ${hotelNames[i]}, a premium ${
          Math.random() > 0.5 ? '4-star' : '3-star'
        } hotel located in the heart of ${province}, Thailand. Our property features state-of-the-art amenities, exceptional service, and comfortable rooms designed for both leisure and business travelers.`,
        location: `${Math.floor(Math.random() * 999) + 1}/${Math.floor(
          Math.random() * 99
        )} Road, ${district}, ${province}, Thailand`,
        ownerID: ownerID,
        tel: generatePhoneNumber(),
        email: `${hotelNames[i].toLowerCase().replace(/\s+/g, '')}_${i}@gmail.com`,
        district: district,
        province: province,
        postalcode: generatePostalCode(),
        region: region,
        pictures: [],
        roomTypes: roomTypes,
        facilities: randomPick(hotelFacilities, 8),
        status: 'available'
      };

      hotels.push(hotel);

      // Create rooms for each room type
      roomTypes.forEach((type) => {
        // Create 2-5 rooms of each type
        const roomCount = Math.floor(Math.random() * 4) + 2;

        for (let j = 0; j < roomCount; j++) {
          const room = {
            hotelID: hotelID,
            roomType: type,
            bedType: getRandomElement(bedTypes),
            bed: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 4000) + 600,
            description: `Beautiful ${type} room with modern furnishings and excellent amenities. Perfect for ${
              type === 'suite' || type === 'deluxe'
                ? 'a luxurious stay'
                : type === 'family'
                ? 'family getaways'
                : 'comfort and convenience'
            }.`,
            picture: [
              `https://example.com/room/${type}_${j + 1}.jpg`,
              `https://example.com/room/${type}_${j + 2}.jpg`
            ],
            facilities: randomPick(roomFacilities, 8),
            availableNumber: Math.floor(Math.random() * 8) + 2,
            status: 'available',
            people: type === 'single' ? 1 : type === 'double' || type === 'twin' ? 2 : type === 'family' ? 4 : 3
          };

          rooms.push(room);
        }
      });
    }

    // =======================
    // INSERT DATA
    // =======================
    const insertedHotels = await Hotel.insertMany(hotels);
    const insertedRooms = await Room.insertMany(rooms);

    console.log(`✅ ${insertedHotels.length} hotels inserted successfully`);
    console.log(`✅ ${insertedRooms.length} rooms inserted successfully`);
    console.log('\n📊 Sample Data:');
    console.log(`   Hotels: ${insertedHotels.length}`);
    console.log(`   Rooms: ${insertedRooms.length}`);
    console.log(`   Avg rooms per hotel: ${(insertedRooms.length / insertedHotels.length).toFixed(1)}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
    process.exit(1);
  }
};

// =======================
// RUN
// =======================
(async () => {
  await connectDB();
  await seedData();
})();