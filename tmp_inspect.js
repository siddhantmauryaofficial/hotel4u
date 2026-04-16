const mongoose = require('mongoose');
const Listing = require('./models/listing');
const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';
(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    const first = await Listing.findOne().lean();
    console.log('sample', first);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
