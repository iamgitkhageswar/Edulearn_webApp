require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const User = require('./models/User');
const Admission = require('./models/admission');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check and attach user from token
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_KEY);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (err) {
    console.error("JWT error:", err);
  }
  next();
};

app.use(authenticate);

// Routes
app.get('/', (req, res) => {
  const submitted = req.query.submitted === 'true';
  res.render('index', { submitted });
});

app.get('/signup', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));

app.get('/admission', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const success = req.query.success === 'true';
  res.render('admission', { success });
});

app.use('/contact', require('./routes/contact'));

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) return res.send('Email already exists.');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();

  res.redirect('/login');
});

// Login route
app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("Email not found");

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.send("Wrong password");

  const token = jwt.sign({ id: user._id }, process.env.ACCESS_KEY, {
    expiresIn: process.env.ACCESS_KEY_EXPIRY,
  });

  res.cookie('token', token, { httpOnly: true });
  res.redirect('/admission');
});

// Admission POST route
app.post('/admission', async (req, res) => {
  try {
    if (!req.user) return res.redirect('/login');

    const newAdmission = new Admission({
      user: req.user._id,
      fullName: req.body.fullName,
      dob: req.body.dob,
      gender: req.body.gender,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      highSchool: req.body.highSchool,
      grade: req.body.grade,
      course: req.body.course,
      declaration: req.body.declaration === 'on'
    });

    await newAdmission.save();

    // ✅ Redirect to home page after successful submission
    res.redirect('/?submitted=true');
  } catch (error) {
    console.error("Error submitting admission:", error);
    res.status(500).send("There was an error processing your application. Please try again.");
  }
});

app.get('/admission', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const success = req.query.success === 'true';
  res.render('admission', { success });
});


// Logout route (optional)
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
