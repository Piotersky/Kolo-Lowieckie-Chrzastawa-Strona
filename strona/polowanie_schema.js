const mongoose = require("mongoose");

const polowania_schema = new mongoose.Schema({
  numer: {
    type: Number,
    required: true,
  },
  data: {
    type: String,
    required: true,
  },
  teren: {
    type: String,
    required: true,
  },
  mysliwi: {
    type: String,
    required: true,
  },
  budzet: {
    type: String,
    required: true,
  },
  dystans: {
    type: String,
    required: true,
  },
  znalezione_struktury: {
    type: String,
    required: true,
  },
  wynik: {
    type: Number,
    required: true,
  },
});
const polowanie = mongoose.model("polowanias", polowania_schema);
module.exports = polowanie;
