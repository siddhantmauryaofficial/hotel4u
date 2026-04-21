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
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const { date } = require('joi');

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

const sessionOptions = {
  secret: 'mysupersecretcode',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24860 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.get('/', (req, res) => {
  res.send('hello world!');
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get(
  '/demouser',
  wrapAsync(async (req, res) => {
    await User.deleteOne({ email: 'siddhant@gmail.com' });
    let fakeUser = new User({
      email: 'siddhant@gmail.com',
      username: 'siddhant',
    });

    let registeredUser = await User.register(fakeUser, 'helloworld');
    res.send(registeredUser);
  })
);

// seed route (reset database from init/data.js)
app.get(
  '/seed',
  wrapAsync(async (req, res) => {
    await Listing.deleteMany({});
    await Listing.insertMany(sampleListings);
    res.redirect('/listings');
  })
);

app.use('/listings', listingsRouter);

app.use('/listings/:id/reviews', reviewsRouter);
app.use('/', userRouter);

app.all('/{*splat}', (req, res, next) => {
  next(new ExpressError(404, 'Page not found!'));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong!' } = err;
  try {
    res.status(statusCode).render('error.ejs', { message });
  } catch (renderErr) {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(8080, () => {
  console.log('server is listening to port 8080');
});
