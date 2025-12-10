// client/JournalApp.jsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const AVATARS = [
  '/assets/img/avatar1.PNG',
  '/assets/img/avatar2.PNG',
  '/assets/img/avatar3.PNG',
  '/assets/img/avatar4.PNG',
  '/assets/img/avatar5.PNG',
];

const JournalApp = () => {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [text, setText] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isPremium, setIsPremium] = useState(() => {
  const serverFlag = window.THOUGHTLOG_IS_PREMIUM;

  if (serverFlag === true || serverFlag === 'true') return true;
  if (serverFlag === false || serverFlag === 'false') return false;

  return window.localStorage.getItem('thoughtlog-premium') === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState(
    () => window.localStorage.getItem('thoughtlog-dark') === 'true',
  );
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem('thoughtlog-theme') || 'tan',
  );
  const [avatarIndex, setAvatarIndex] = useState(
    () => parseInt(window.localStorage.getItem('thoughtlog-avatar') || '0', 10),
  );

  // which extra panel is open: "none" | "account" | "theme" | "stats"
  const [panel, setPanel] = useState('none');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load entries on mount
  useEffect(() => {
    fetch('/journal/entries')
      .then((res) => res.json())
      .then((data) => {
        const loadedEntries = data.entries || [];
        setEntries(loadedEntries);
        setSelectedDate(todayKey());
      })
      .catch((err) => console.error('Error loading entries', err));
  }, []);

  // Persist preferences
  useEffect(() => {
    window.localStorage.setItem('thoughtlog-premium', isPremium ? 'true' : 'false');
  }, [isPremium]);

  useEffect(() => {
    window.localStorage.setItem('thoughtlog-dark', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  useEffect(() => {
    window.localStorage.setItem('thoughtlog-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('thoughtlog-avatar', String(avatarIndex));
  }, [avatarIndex]);

  // --- Journal message handling ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          journalDateKey: selectedDate,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.entry) {
        const newEntry = data.entry;
        setEntries((prev) => [...prev, newEntry]);
        const entryDateKey = toDateKey(newEntry.journalDate || newEntry.createdAt);
        setSelectedDate(entryDateKey);
        setText('');
      }
    } catch (err) {
      console.error('Error posting entry', err);
    }
  };

  const goToPrevDay = () => setSelectedDate((prev) => addDaysToKey(prev, -1));

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const next = addDaysToKey(prev, 1);
      const today = todayKey();
      return next > today ? prev : next;
    });
  };

  const today = todayKey();

  const datesWithEntries = Array.from(
    new Set(entries.map((e) => toDateKey(e.journalDate || e.createdAt))),
  );

  const visibleEntries = entries.filter((e) => {
    const journalKey = toDateKey(e.journalDate || e.createdAt);
    return journalKey === selectedDate;
  });

  const selectedLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : 'No date selected';

  // --- Premium / stats ---

  const openStatsPanel = async () => {
    setPanel('stats');
    if (!isPremium) {
      // show locked view; no need to load stats
      return;
    }
    if (stats || statsLoading) return;

    setStatsLoading(true);
    try {
      const res = await fetch('/journal/stats');
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // --- Appearance / theme ---

  const handleToggleDark = () => setIsDarkMode((prev) => !prev);

  const handleThemeSelect = (name) => {
    if (!isPremium && name !== 'tan' && name !== 'ocean') return;
    setTheme(name);
  };

  const pageClass = `journal-page theme-${theme}${isDarkMode ? ' dark' : ''}`;

  return (
    <div className={pageClass}>
      {/* LEFT SIDE NAV, per mockup */}
      <aside className="side-nav">
        <div className="side-profile">
          <div className="avatar-wrapper">
            <div className="avatar-bg">
              <img
                src={AVATARS[avatarIndex] || AVATARS[0]}
                alt="avatar"
                className="avatar-img"
              />
            </div>
          </div>

          <div className="side-profile-text">
            <div className={`premium-pill ${isPremium ? 'premium' : 'standard'}`}>
              {isPremium ? 'Premium user' : 'Standard user'}
            </div>
          </div>
        </div>


        <nav className="side-menu">
          <button
            type="button"
            className={`side-menu-item ${panel === 'account' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'account' ? 'none' : 'account')}
          >
            <span className="side-icon">⚙️</span>
            <span className="side-label">Account</span>
          </button>

          <button
            type="button"
            className="side-menu-item"
            onClick={() => setIsPremium((p) => !p)}
          >
            <span className="side-icon">⭐</span>
            <span className="side-label">Premium</span>
            <span className="side-toggle-text">
              {isPremium ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            className={`side-menu-item ${panel === 'theme' ? 'active' : ''}`}
            onClick={() => setPanel(panel === 'theme' ? 'none' : 'theme')}
          >
            <span className="side-icon">🖌️</span>
            <span className="side-label">Theme</span>
          </button>

          <button
            type="button"
            className={`side-menu-item ${panel === 'stats' ? 'active' : ''}`}
            onClick={openStatsPanel}
          >
            <span className="side-icon">📊</span>
            <span className="side-label">Stats</span>
          </button>
        </nav>

        <a href="/logout" className="logout-button">
          Log Out
        </a>
      </aside>

      {/* RIGHT MAIN: DATE BAR + CHAT + PANELS */}
      <div className="journal-shell">
        <header className="journal-header">
          <button
            type="button"
            className="chevron-btn"
            onClick={goToPrevDay}
          >
            ‹
          </button>

          <div className="header-date">{selectedLabel.toUpperCase()}</div>

          <div className="header-right">
            <button
              type="button"
              className="chevron-btn"
              onClick={goToNextDay}
            >
              ›
            </button>
            <button
              type="button"
              className="calendar-icon-btn"
              onClick={() => setIsCalendarOpen(true)}
            >
              📅
            </button>
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="journal-main">
          <div className="journal-messages">
            {visibleEntries.length === 0 ? (
              <p className="empty-state">
                No entries for this day yet. Start typing to record your thoughts ✨
              </p>
            ) : (
              visibleEntries.map((e) => {
                const journalKey = toDateKey(e.journalDate || e.createdAt);
                const createdKey = toDateKey(e.createdAt);

                const isReplyFromFuture = createdKey > journalKey;
                const isToday = journalKey === today;

                const bubbleClass = isToday
                  ? 'message-bubble self'
                  : isReplyFromFuture
                  ? 'message-bubble self'
                  : 'message-bubble other';

                return (
                  <div key={e._id} className={bubbleClass}>
                    <div className="message-time">
                      {formatTime(e.createdAt)}
                    </div>
                    <div className="message-text">{e.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <form className="journal-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your thoughts..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit">SEND</button>
          </form>
        </main>

        {/* PANELS */}
        {panel === 'account' && (
          <AccountPanel
            avatarIndex={avatarIndex}
            setAvatarIndex={setAvatarIndex}
            onClose={() => setPanel('none')}
          />
        )}

        {panel === 'theme' && (
          <ThemePanel
            isDarkMode={isDarkMode}
            onToggleDark={handleToggleDark}
            theme={theme}
            onSelectTheme={handleThemeSelect}
            isPremium={isPremium}
            onClose={() => setPanel('none')}
          />
        )}

        {panel === 'stats' && (
          <StatsPanel
            isPremium={isPremium}
            stats={stats}
            loading={statsLoading}
            onClose={() => setPanel('none')}
          />
        )}
      </div>

      {isCalendarOpen && (
        <CalendarModal
          selectedDate={selectedDate}
          datesWithEntries={datesWithEntries}
          onSelect={(dateKey) => {
            setSelectedDate(dateKey);
            setIsCalendarOpen(false);
          }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </div>
  );
};

/* ===== Account Panel ===== */

const AccountPanel = ({ avatarIndex, setAvatarIndex, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!currentPassword || !newPassword) {
      setStatus('Please fill out both password fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setStatus(data.error);
      } else {
        setStatus('Password updated!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      console.error('Error changing password', err);
      setStatus('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="account-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header-row">
          <h2>Account</h2>
          <button type="button" className="panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <section className="panel-section">
          <h3>Avatar</h3>
          <div className="avatar-choices">
            {AVATARS.map((src, idx) => (
              <button
                key={src}
                type="button"
                className={`avatar-choice ${avatarIndex === idx ? 'selected' : ''}`}
                onClick={() => setAvatarIndex(idx)}
              >
                <img src={src} alt={`avatar ${idx + 1}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <h3>Change Password</h3>
          <form className="password-form" onSubmit={handleSubmit}>
            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            {status && <p className="panel-note">{status}</p>}

            <button
              type="submit"
              className="save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'SAVE'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

/* ===== Theme Panel ===== */

const ThemePanel = ({
  isDarkMode,
  onToggleDark,
  theme,
  onSelectTheme,
  isPremium,
  onClose,
}) => {
  const THEMES = [
    { id: 'tan', label: 'tan', color: '#e1c49b' },
    { id: 'ocean', label: 'ocean', color: '#73aee9' },
    { id: 'autumn', label: 'autumn', color: '#f49a6b' },
    { id: 'lilac', label: 'lilac', color: '#c5a7f2' },
    { id: 'moss', label: 'moss', color: '#94c49a' },
    { id: 'moon', label: 'moon', color: '#dde2eb' },
    { id: 'night', label: 'night', color: '#111827' },
  ];

  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="theme-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header-row">
          <h2>Theme</h2>
          <button type="button" className="panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <section className="panel-section">
          <h3>Day / Night</h3>
          <div className="daynight-row">
            <span className="day-icon">☀️</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={onToggleDark}
              />
              <span className="slider" />
            </label>
            <span className="night-icon">🌙</span>
          </div>
        </section>

        <section className="panel-section">
          <h3>Color theme</h3>
          <p className="panel-note">
            Tan and ocean are free. Others unlock with Premium.
          </p>
          <div className="theme-palette-row">
            {THEMES.map((t) => {
              const locked =
                !isPremium && t.id !== 'tan' && t.id !== 'ocean';
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-swatch ${isActive ? 'active' : ''} ${
                    locked ? 'locked' : ''
                  }`}
                  style={{ backgroundColor: t.color }}
                  onClick={() => onSelectTheme(t.id)}
                >
                  {locked && <span className="lock-icon">🔒</span>}
                  <span className="swatch-label">{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

/* ===== Stats Panel ===== */

const StatsPanel = ({ isPremium, stats, loading, onClose }) => {
  const showReal = isPremium && stats;

  const totalEntries = showReal ? stats.totalEntries : '–';
  const totalWords = showReal ? stats.totalWords : '–';
  const daysWithEntries = showReal ? stats.daysWithEntries : '–';
  const longestStreak = showReal ? stats.longestStreak : '–';

  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="stats-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header-row">
          <h2>Stats</h2>
          <button type="button" className="panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {!isPremium && (
          <p className="panel-note locked-note">
            Statistics are a Premium feature. Turn on Premium in the sidebar to
            unlock your writing insights.
          </p>
        )}

        {loading && <p className="panel-note">Loading stats…</p>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total entries</div>
            <div className="stat-value">{totalEntries}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total words</div>
            <div className="stat-value">{totalWords}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active days</div>
            <div className="stat-value">{daysWithEntries}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Longest streak</div>
            <div className="stat-value">{longestStreak}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Calendar Modal (unchanged behavior) ===== */

const CalendarModal = ({ selectedDate, datesWithEntries, onSelect, onClose }) => {
  const [year, setYear] = useState(() => {
    const [y] = selectedDate.split('-').map((n) => parseInt(n, 10));
    return y;
  });
  const [month, setMonth] = useState(() => {
    const [, m] = selectedDate.split('-').map((n) => parseInt(n, 10));
    return m - 1;
  });

  const entrySet = new Set(datesWithEntries);

  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let currentDay = 1 - firstWeekday;

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      if (currentDay < 1 || currentDay > daysInMonth) {
        week.push(null);
      } else {
        week.push(currentDay);
      }
      currentDay++;
    }
    weeks.push(week);
  }

  const changeMonth = (delta) => {
    const newDate = new Date(year, month + delta, 1);
    setYear(newDate.getFullYear());
    setMonth(newDate.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  const selectedKey = selectedDate;

  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => changeMonth(-1)}
          >
            ‹
          </button>
          <div className="calendar-month-label">{monthLabel}</div>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => changeMonth(1)}
          >
            ›
          </button>
        </div>

        <div className="calendar-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
            <div key={d} className="calendar-day-header">
              {d}
            </div>
          ))}

          {weeks.map((week, i) =>
            week.map((day, j) => {
              if (!day) {
                return <div key={`${i}-${j}`} className="calendar-day empty" />;
              }
              const dateKey = toDateKey(new Date(year, month, day));
              const hasEntries = entrySet.has(dateKey);
              const isSelected = selectedKey === dateKey;
              return (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  className={`calendar-day${isSelected ? ' selected' : ''}`}
                  onClick={() => onSelect(dateKey)}
                >
                  <span>{day}</span>
                  {hasEntries && <span className="entry-dot" />}
                </button>
              );
            }),
          )}
        </div>

        <button
          type="button"
          className="calendar-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ===== Helpers ===== */

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
    month: 'long',
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
