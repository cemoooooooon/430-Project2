const models = require("../models");

const { JournalEntry } = models;

// render the main journal page
const journalPage = (req, res) => {
  if (!req.session.account) {
    return res.redirect("/login");
  }

  return res.render("app");
};

// GET journal entries
const getEntries = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: "You must be logged in!" });
  }

  try {
    const query = { owner: req.session.account._id };
    const docs = await JournalEntry.find(query)
      .sort({ timestamp: 1 })
      .lean()
      .exec();

    return res.json({ entries: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error retrieving entries!" });
  }
};

// POST journal entries
const createEntry = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: "You must be logged in!" });
  }

  if (!req.body.text) {
    return res.status(400).json({ error: "Message text is required!" });
  }

  const entryData = {
    text: req.body.text,
    owner: req.session.account._id,
  };

  try {
    const newEntry = new JournalEntry(entryData);
    await newEntry.save();
    return res.status(201).json({ entry: JournalEntry.toAPI(newEntry) });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "An error occurred creating entry!" });
  }
};

module.exports = {
  journalPage,
  getEntries,
  createEntry,
};
