const mongoose = require('mongoose');

const { Schema } = mongoose;

const MigrationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'started',
  },
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = mongoose.model('Migration', MigrationSchema);

