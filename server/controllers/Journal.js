const models = require('../models');

const { JournalEntry } = models;

// render the main journal page
const journalPage = (req, res) => {
  if (!req.session.account) {
    return res.redirect('/login');
  }

  return res.render('app', {
    username: req.session.account.username,
    isPremium: req.session.account.isPremium,
  });
};

// GET journal entries
const getEntries = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: 'You must be logged in!' });
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
    return res.status(500).json({ error: 'Error retrieving entries!' });
  }
};

// POST journal entries
const createEntry = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: 'You must be logged in!' });
  }

  if (!req.body.text) {
    return res.status(400).json({ error: 'Message text is required!' });
  }

  // "YYYY-MM-DD" for the day this message belongs to
  const { journalDateKey } = req.body;

  if (!journalDateKey) {
    return res.status(400).json({ error: 'Missing journal date' });
  }

  const [y, m, d] = journalDateKey.split('-').map((n) => parseInt(n, 10));
  const journalDate = new Date(y, m - 1, d);
  const createdAt = new Date();

  // don't allow journaling into the future
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (journalDateKey > todayKey) {
    return res.status(400).json({ error: 'Cannot write in future days.' });
  }

  const entryData = {
    text: req.body.text,
    journalDate,
    createdAt,
    owner: req.session.account._id,
  };

  try {
    const newEntry = new JournalEntry(entryData);
    await newEntry.save();
    return res.status(201).json({ entry: JournalEntry.toAPI(newEntry) });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'An error occurred creating entry!' });
  }
};

// premium stats
const getStats = async (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: 'You must be logged in!' });
  }

  try {
    const query = { owner: req.session.account._id };
    const docs = await JournalEntry.find(query).lean().exec();

    const totalEntries = docs.length;

    const totalWords = docs.reduce((sum, e) => {
      const words = e.text ? e.text.split(/\s+/).filter(Boolean).length : 0;
      return sum + words;
    }, 0);

    const dateKeys = Array.from(
      new Set(
        docs.map((e) => {
          const d = e.journalDate || e.createdAt;
          const dt = new Date(d);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }),
      ),
    ).sort();

    const daysWithEntries = dateKeys.length;

    // longest streak of consecutive days
    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate = null;

    for (let i = 0; i < dateKeys.length; i += 1) {
      const key = dateKeys[i];
      const [year, month, day] = key.split('-').map((n) => parseInt(n, 10));
      const thisDate = new Date(year, month - 1, day);

      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffMs = thisDate - prevDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      prevDate = thisDate;
    }

    return res.json({
      totalEntries,
      totalWords,
      daysWithEntries,
      longestStreak,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error calculating stats!' });
  }
};

module.exports = {
  journalPage,
  getEntries,
  createEntry,
  getStats,
};
