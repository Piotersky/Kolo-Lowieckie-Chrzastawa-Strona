const mongoose = require("mongoose");

const struktura_schema = new mongoose.Schema({
  numer: {
    type: String,
    required: true,
  },
  rodzaj: {
    type: Number,
    required: true,
  },
  photo: {
    type: String,
  },
  longitude: {
    type: String,
  },
  latitude: {
    type: String,
  },
  polowanie: {
    type: Number,
    required: true,
  },
});
const struktura = mongoose.model("strukturys", struktura_schema);
module.exports = struktura;
