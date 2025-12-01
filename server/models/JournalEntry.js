const mongoose = require("mongoose");
const _ = require("underscore");

const setText = (text) => _.escape(text).trim();

const JournalEntrySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    set: setText,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "Account",
  },
});

JournalEntrySchema.statics.toAPI = (doc) => ({
  _id: doc._id,
  text: doc.text,
  timestamp: doc.timestamp,
});

const JournalEntryModel = mongoose.model("JournalEntry", JournalEntrySchema);
module.exports = JournalEntryModel;
