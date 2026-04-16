const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const { data: sampleListings } = require('./init/data.js');
const path = require('path');
const { render } = require('ejs');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('./schema.js');
const Review = require('./models/review.js');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

const listings = require('./routes/listing.js');
const reviews = require('./routes/review.js');

main()
  .then(() => {
    console.log('connected to DB');
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('hello world!');
});

// seed route (reset database from init/data.js)
app.get(
  '/seed',
  wrapAsync(async (req, res) => {
    await Listing.deleteMany({});
    await Listing.insertMany(sampleListings);
    res.redirect('/listings');
  })
);

app.use('/listings', listings);

app.use('/listings/:id/reviews', reviews);

app.all('/{*splat}', (req, res, next) => {
  next(new ExpressError(404, 'Page not found!'));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong!' } = err;
  res.status(statusCode).render('error.ejs', { message });
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log('server is listening to port 8080');
});
