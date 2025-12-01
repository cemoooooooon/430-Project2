import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const JournalApp = () => {
  const [entries, setEntries] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [text, setText] = useState('');

  // load existing entries on first render
  useEffect(() => {
    fetch('/journal/entries')
      .then((res) => res.json())
      .then((data) => {
        const loadedEntries = data.entries || [];
        setEntries(loadedEntries);

        // build sorted list of distinct date keys
        const uniqueDates = Array.from(
          new Set(loadedEntries.map((e) => toDateKey(e.timestamp))),
        ).sort(); // ascending order!

        setDates(uniqueDates);

        // default selectedDate: most recent date with entries, or today if none
        if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[uniqueDates.length - 1]);
        } else {
          setSelectedDate(todayKey());
        }
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

        const entryDateKey = toDateKey(newEntry.timestamp);

        setDates((prevDates) => {
          const set = new Set(prevDates);
          set.add(entryDateKey);
          return Array.from(set).sort();
        });

        // move view to the date of the new entry
        setSelectedDate(entryDateKey);
        setText('');
      }
    } catch (err) {
      console.error('Error posting entry', err);
    }
  };

  // navigation helpers
  const goToPrevDay = () => {
    if (!selectedDate || dates.length === 0) return;
    const idx = dates.indexOf(selectedDate);
    if (idx > 0) {
      setSelectedDate(dates[idx - 1]);
    }
  };

  const goToNextDay = () => {
    if (!selectedDate || dates.length === 0) return;
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0 && idx < dates.length - 1) {
      setSelectedDate(dates[idx + 1]);
    }
  };

  const hasPrev = selectedDate && dates.indexOf(selectedDate) > 0;
  const hasNext =
    selectedDate &&
    dates.length > 0 &&
    dates.indexOf(selectedDate) < dates.length - 1;

  // entries visible for the current selected day
  const visibleEntries = entries.filter(
    (e) => toDateKey(e.timestamp) === selectedDate,
  );

  const selectedLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : 'No date selected';

  return (
    <div className="journal-page">
      <header className="journal-header">
        <h1>ThoughtLog</h1>
        {/* placeholder for future calendar function */}
        <button className="calendar-button" type="button">
          📅
        </button>
      </header>

      <main className="journal-main">
        {/* day nav bar */}
        <div className="day-nav">
          <button
            type="button"
            className="day-nav-btn"
            onClick={goToPrevDay}
            disabled={!hasPrev}
          >
            ← Previous
          </button>

          <div className="day-label">{selectedLabel}</div>

          <button
            type="button"
            className="day-nav-btn"
            onClick={goToNextDay}
            disabled={!hasNext}
          >
            Next →
          </button>
        </div>

        <div className="journal-messages">
          {visibleEntries.length === 0 ? (
            <p className="empty-state">
              {dates.length === 0
                ? 'Start typing to record your day ✨'
                : 'No entries for this day yet.'}
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
            placeholder="Type your thoughts..."
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