const mongoose = require('../../mongoose');

const { Schema } = mongoose;

const MigrationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Migration', MigrationSchema);

