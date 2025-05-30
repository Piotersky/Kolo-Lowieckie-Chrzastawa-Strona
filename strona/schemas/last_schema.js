const mongoose = require("mongoose");

const last_schema = new mongoose.Schema({
  numer: {
    type: Number,
    required: true,
  },
  rodzaj: {
    type: Number,
    required: true,
  },
});
const last = mongoose.model("lasts", last_schema);
module.exports = last;
