const express = require('express');
const router = express.Router();
const Contact = require('../models/contact.js');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await Contact.create({ name, email, message });
    res.redirect('/?submitted=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
