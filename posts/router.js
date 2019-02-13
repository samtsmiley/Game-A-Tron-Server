'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const {Post} = require('./models');

router.use('/', passport.authenticate('jwt', {session: false, failWithError: true}));

router.get('/', (req, res, next) => {});
router.get('/:id', (req, res, next) => {});
router.post('/', (req, res, next) => {});
router.put('/:id', (req, res, next) => {});
router.delete('/:id', (req, res, next) => {});
