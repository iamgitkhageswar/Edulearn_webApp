const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: String,
  dob: Date,
  gender: String,
  email: String,
  phone: String,
  address: String,
  highSchool: String,
  grade: String,
  course: String,
  declaration: Boolean
});

module.exports = mongoose.model('Admission', admissionSchema);
