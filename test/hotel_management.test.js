jest.mock('../models/Hotel');
jest.mock('../models/User');
jest.mock('../models/Booking');
jest.mock('../models/Room');

const Hotel   = require('../models/Hotel');
const User    = require('../models/User');
const Booking = require('../models/Booking');
const Room    = require('../models/Room');

const {
  getManyHotels,
  getSingleHotel,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/hotels'); // adjust path as needed

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal mock res object */
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

/** Build a mock query chain (select / sort / await) */
const mockQuery = (resolveValue) => {
  const q = {};
  q.select = jest.fn().mockReturnValue(q);
  q.sort   = jest.fn().mockReturnValue(q);
  // make the object thenable so `await query` works
  q.then   = (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject);
  return q;
};

// ---------------------------------------------------------------------------
// getManyHotels
// ---------------------------------------------------------------------------

describe('getManyHotels', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns hotels with default sort (no select/sort in query)', async () => {
    const hotels = [{ _id: '1', name: 'A' }];
    const q = mockQuery(hotels);
    Hotel.find = jest.fn().mockReturnValue(q);

    const req = { query: { page: '1', limit: '10' } }; // removeFields exercised
    const res = mockRes();

    await getManyHotels(req, res);

    expect(Hotel.find).toHaveBeenCalledWith({});
    expect(q.sort).toHaveBeenCalledWith('-createdAt');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 1,
      data: hotels,
    });
  });

  test('applies select and sort query params', async () => {
    const hotels = [];
    const q = mockQuery(hotels);
    Hotel.find = jest.fn().mockReturnValue(q);

    const req = { query: { select: 'name,location', sort: 'name,-createdAt' } };
    const res = mockRes();

    await getManyHotels(req, res);

    expect(q.select).toHaveBeenCalledWith('name location');
    expect(q.sort).toHaveBeenCalledWith('name -createdAt');
  });

  test('converts MongoDB operators (gt/gte/lt/lte/in)', async () => {
    const q = mockQuery([]);
    Hotel.find = jest.fn().mockReturnValue(q);

    // e.g. ?price[gt]=100&rating[lte]=5
    const req = { query: { price: { gt: '100' }, rating: { lte: '5' } } };
    const res = mockRes();

    await getManyHotels(req, res);

    const findArg = Hotel.find.mock.calls[0][0];
    expect(JSON.stringify(findArg)).toMatch(/\$gt/);
    expect(JSON.stringify(findArg)).toMatch(/\$lte/);
  });

  test('returns 500 on unexpected error', async () => {
    Hotel.find = jest.fn().mockImplementation(() => {
      throw new Error('DB exploded');
    });

    const req = { query: {} };
    const res = mockRes();

    await getManyHotels(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, msg: 'DB exploded' })
    );
  });
});

// ---------------------------------------------------------------------------
// getSingleHotel
// ---------------------------------------------------------------------------

describe('getSingleHotel', () => {
  afterEach(() => jest.clearAllMocks());

  /** Shared hotel stub */
  const hotelDoc = {
    _id: 'hotel1',
    name: 'Test Hotel',
    toObject: () => ({ _id: 'hotel1', name: 'Test Hotel' }),
  };

  const roomDoc = (id = 'room1') => ({
    _id: id,
    availableNumber: 5,
    toObject: () => ({ _id: id, availableNumber: 5 }),
  });

  test('404 when hotel not found', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(null);
    Room.find     = jest.fn().mockResolvedValue([]);

    const req = { params: { hotelID: 'bad' }, query: {} };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns hotel with rooms, no dates supplied', async () => {
    Hotel.findById         = jest.fn().mockResolvedValue(hotelDoc);
    Room.find              = jest.fn().mockResolvedValue([roomDoc()]);
    Booking.countDocuments = jest.fn().mockResolvedValue(0);

    const req = { params: { hotelID: 'hotel1' }, query: {} };
    const res = mockRes();

    await getSingleHotel(req, res);

    // bookedCount should remain 0 (dates branch not entered)
    expect(Booking.countDocuments).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.rooms[0].available).toBe(5);
  });

  test('returns hotel with rooms and valid dates', async () => {
    Hotel.findById         = jest.fn().mockResolvedValue(hotelDoc);
    Room.find              = jest.fn().mockResolvedValue([roomDoc()]);
    Booking.countDocuments = jest.fn().mockResolvedValue(2);

    const req = {
      params: { hotelID: 'hotel1' },
      query: { checkInDate: '2026-06-01', checkOutDate: '2026-06-05', people: '2' },
    };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(Booking.countDocuments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.rooms[0].available).toBe(3); // 5 - 2
  });

  test('400 on invalid date format', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(hotelDoc);
    Room.find      = jest.fn().mockResolvedValue([]);

    const req = {
      params: { hotelID: 'hotel1' },
      query: { checkInDate: 'not-a-date', checkOutDate: '2026-06-05' },
    };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Invalid date format' })
    );
  });

  test('400 when checkOutDate is not after checkInDate', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(hotelDoc);
    Room.find      = jest.fn().mockResolvedValue([]);

    const req = {
      params: { hotelID: 'hotel1' },
      query: { checkInDate: '2026-06-05', checkOutDate: '2026-06-01' },
    };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'checkOutDate must be after checkInDate' })
    );
  });

  test('400 on CastError (invalid ObjectId)', async () => {
    const castErr = new Error('Cast failed');
    castErr.name  = 'CastError';
    Hotel.findById = jest.fn().mockRejectedValue(castErr);

    const req = { params: { hotelID: 'bad-id' }, query: {} };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Invalid hotel ID format' })
    );
  });

  test('500 on generic error', async () => {
    Hotel.findById = jest.fn().mockRejectedValue(new Error('oops'));

    const req = { params: { hotelID: 'hotel1' }, query: {} };
    const res = mockRes();

    await getSingleHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('available floored to 0 when bookedNumber exceeds availableNumber', async () => {
    Hotel.findById         = jest.fn().mockResolvedValue(hotelDoc);
    Room.find              = jest.fn().mockResolvedValue([roomDoc()]);
    Booking.countDocuments = jest.fn().mockResolvedValue(10); // more than 5 available

    const req = {
      params: { hotelID: 'hotel1' },
      query: { checkInDate: '2026-06-01', checkOutDate: '2026-06-05' },
    };
    const res = mockRes();

    await getSingleHotel(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.rooms[0].available).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// createHotel
// ---------------------------------------------------------------------------

describe('createHotel', () => {
  afterEach(() => jest.clearAllMocks());

  test('403 when requester is not admin', async () => {
    const req = { user: { role: 'hotelOwner' }, body: {} };
    const res = mockRes();

    await createHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('400 when ownerEmail is missing', async () => {
    const req = { user: { role: 'admin' }, body: { ownerEmail: '' } };
    const res = mockRes();

    await createHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'ownerEmail is required' })
    );
  });

  test('400 when user with ownerEmail is not found', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    const req = { user: { role: 'admin' }, body: { ownerEmail: 'ghost@mail.com' } };
    const res = mockRes();

    await createHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User not found' })
    );
  });

  test('400 when found user is not a hotelOwner', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: 'u1', role: 'user' });

    const req = { user: { role: 'admin' }, body: { ownerEmail: 'user@mail.com' } };
    const res = mockRes();

    await createHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User is not a hotel owner' })
    );
  });

  test('201 on successful creation', async () => {
    User.findOne  = jest.fn().mockResolvedValue({ _id: 'owner1', role: 'hotelOwner' });
    Hotel.create  = jest.fn().mockResolvedValue({ _id: 'h1', name: 'New Hotel' });

    const req = {
      user: { role: 'admin' },
      body: { ownerEmail: 'owner@mail.com', name: 'New Hotel' },
    };
    const res = mockRes();

    await createHotel(req, res);

    expect(Hotel.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerID: 'owner1' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('500 on unexpected error', async () => {
    User.findOne = jest.fn().mockRejectedValue(new Error('DB down'));

    const req = { user: { role: 'admin' }, body: { ownerEmail: 'owner@mail.com' } };
    const res = mockRes();

    await createHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Cannot create hotel' })
    );
  });
});

// ---------------------------------------------------------------------------
// updateHotel
// ---------------------------------------------------------------------------

describe('updateHotel', () => {
  afterEach(() => jest.clearAllMocks());

  const hotelDoc = {
    _id: 'hotel1',
    ownerID: { toString: () => 'owner1' },
  };

  test('404 when hotel not found', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(null);

    const req = { params: { hotelID: 'x' }, user: { role: 'admin', id: 'admin1' }, body: {} };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('403 when regular user tries to update', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(hotelDoc);

    const req = {
      params: { hotelID: 'hotel1' },
      user: { role: 'user', id: 'user1' },
      body: {},
    };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('403 when hotelOwner is not the real owner', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(hotelDoc);

    const req = {
      params: { hotelID: 'hotel1' },
      user: { role: 'hotelOwner', id: 'someoneElse' },
      body: {},
    };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('200 when admin updates hotel', async () => {
    Hotel.findById          = jest.fn().mockResolvedValue(hotelDoc);
    Hotel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'hotel1', name: 'Updated' });

    const req = {
      params: { hotelID: 'hotel1' },
      user: { role: 'admin', id: 'admin1' },
      body: { name: 'Updated' },
    };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('200 when real hotelOwner updates their own hotel', async () => {
    Hotel.findById          = jest.fn().mockResolvedValue(hotelDoc);
    Hotel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: 'hotel1', name: 'Mine' });

    const req = {
      params: { hotelID: 'hotel1' },
      user: { role: 'hotelOwner', id: 'owner1' }, // matches hotelDoc.ownerID
      body: { name: 'Mine' },
    };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('400 on error thrown during update', async () => {
    Hotel.findById = jest.fn().mockRejectedValue(new Error('bad'));

    const req = {
      params: { hotelID: 'hotel1' },
      user: { role: 'admin', id: 'admin1' },
      body: {},
    };
    const res = mockRes();

    await updateHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ---------------------------------------------------------------------------
// deleteHotel
// ---------------------------------------------------------------------------

describe('deleteHotel', () => {
  afterEach(() => jest.clearAllMocks());

  const hotelDoc = { _id: 'hotel1' };

  test('404 when hotel not found', async () => {
    Hotel.findById = jest.fn().mockResolvedValue(null);

    const req = { params: { hotelID: 'missing' } };
    const res = mockRes();

    await deleteHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 when active (future) bookings exist', async () => {
    Hotel.findById  = jest.fn().mockResolvedValue(hotelDoc);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const bookingMock = {
      checkOutDate: futureDate,
      sort: jest.fn().mockResolvedValue({
        checkOutDate: futureDate,
        toISOString: () => futureDate.toISOString(),
      }),
    };

    // findOne().sort() chain
    Booking.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        checkOutDate: futureDate,
      }),
    });

    const req = { params: { hotelID: 'hotel1' } };
    const res = mockRes();

    await deleteHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, msg: expect.stringContaining('Cannot delete hotel') })
    );
  });

  test('200 on successful deletion (no active bookings)', async () => {
    Hotel.findById          = jest.fn().mockResolvedValue(hotelDoc);
    Booking.findOne         = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    Room.deleteMany         = jest.fn().mockResolvedValue({});
    Booking.deleteMany      = jest.fn().mockResolvedValue({});
    Hotel.findByIdAndDelete = jest.fn().mockResolvedValue({});

    const req = { params: { hotelID: 'hotel1' } };
    const res = mockRes();

    await deleteHotel(req, res);

    expect(Room.deleteMany).toHaveBeenCalledWith({ hotelID: 'hotel1' });
    expect(Booking.deleteMany).toHaveBeenCalledWith({ hotelID: 'hotel1' });
    expect(Hotel.findByIdAndDelete).toHaveBeenCalledWith('hotel1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
  });

  test('500 on unexpected error', async () => {
    Hotel.findById = jest.fn().mockRejectedValue(new Error('network fail'));

    const req = { params: { hotelID: 'hotel1' } };
    const res = mockRes();

    await deleteHotel(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});