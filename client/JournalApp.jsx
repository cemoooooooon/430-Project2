import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const JournalApp = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [text, setText] = useState('');

  // load existing entries on first render
  useEffect(() => {
    fetch('/journal/entries')
      .then((res) => res.json())
      .then((data) => {
        const loadedEntries = data.entries || [];
        setEntries(loadedEntries);

        // default view = today
        setSelectedDate(todayKey());
      })
      .catch((err) => {
        console.error('Error loading entries', err);
      });
  }, []);

  // send a new message
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.entry) {
        const newEntry = data.entry;

        setEntries((prev) => [...prev, newEntry]);

        // jump view to the day the new entry belongs to
        const entryDateKey = toDateKey(newEntry.timestamp);
        setSelectedDate(entryDateKey);

        setText('');
      }
    } catch (err) {
      console.error('Error posting entry', err);
    }
  };

  // navigation helpers: move +1 or -1 day
  const goToPrevDay = () => {
    setSelectedDate((prev) => addDaysToKey(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const next = addDaysToKey(prev, 1);
      const today = todayKey();
      // block moving into the future
      return next > today ? prev : next;
    });
  };

  const selectedLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : 'No date selected';

  // entries visible for the current selected day
  const visibleEntries = entries.filter(
    (e) => toDateKey(e.timestamp) === selectedDate,
  );

  return (
    <div className="journal-page">
      <header className="journal-header">
        <h1>ThoughtLog</h1>
        <button className="calendar-button" type="button">
          📅
        </button>
      </header>

      <main className="journal-main">
        {/* Day navigation bar */}
        <div className="day-nav">
          <button
            type="button"
            className="day-nav-btn"
            onClick={goToPrevDay}
          >
            ← Previous
          </button>

          <div className="day-label">{selectedLabel}</div>

          <button
            type="button"
            className="day-nav-btn"
            onClick={goToNextDay}
          >
            Next →
          </button>
        </div>

        <div className="journal-messages">
          {visibleEntries.length === 0 ? (
            <p className="empty-state">
              No entries for this day yet. Start typing to record your thoughts ✨
            </p>
          ) : (
            visibleEntries.map((e) => (
              <div key={e._id} className="message-bubble">
                <div className="message-time">{formatTime(e.timestamp)}</div>
                <div className="message-text">{e.text}</div>
              </div>
            ))
          )}
        </div>

        <form className="journal-input" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
};

// helper functions!

const toDateKey = (ts) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayKey = () => toDateKey(Date.now());

const addDaysToKey = (dateKey, delta) => {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
};

const formatDateLabel = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const init = () => {
  const rootElement = document.getElementById('app');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<JournalApp />);
  }
};

export default JournalApp;
export { init };
