'use strict';
const express = require('express');
const mongoose = require('mongoose');

//image upload stuff
const cloudinary = require('cloudinary');
const formData = require('express-form-data');

const router = express.Router();
 
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});


router.use(formData.parse());

router.post('/', (req, res) => {
  const values = Object.values(req.files);
  const promises = values.map(image => cloudinary.uploader.upload(image.path));

  Promise
    .all(promises)
    .then(results => res.json(results));
});

//ADD THESE OTHER ENDPOINTS:
//get by (cloudinary id)
//put by (cloudinary id)
//delete by (cloudinary id)

module.exports = {router};