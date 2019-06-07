'use strict';

const mongoose = require('mongoose'); // eslint-disable-line

const { Schema } = mongoose;

const MigrationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Migration', MigrationSchema, '_migrations');
