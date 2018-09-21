'use strict';

const path = require('path');

const mongoosePath = path.join(process.cwd(), 'node_modules', 'mongoose');
const mongoose = require(mongoosePath); // eslint-disable-line

const { Schema } = mongoose;

const MigrationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Migration', MigrationSchema, '_migrations');

