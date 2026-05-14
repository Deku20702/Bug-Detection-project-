import React, { useState } from 'react';

const Navbar = ({ userName, initials, handleLogout, activePage, setActivePage, darkMode, setDarkMode, hasResults, downloadCsv }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'projects', label: 'Projects' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <nav className="navbar">
      <a className="navbar-logo" onClick={() => setActivePage('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="navbar-logo-icon">🐞</div>
        <div className="navbar-logo-text">Bug<span>Scan</span> AI</div>
      </a>

      <div className="navbar-nav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`nav-link ${activePage === item.key ? 'active' : ''}`}
            onClick={() => setActivePage(item.key)}
          >
            {item.label}
          </button>
        ))}
        <a
          className="nav-link"
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs ↗
        </a>
      </div>

      <div className="navbar-right">
        <div className="settings-dropdown">
          <div className="settings-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="settings-avatar">{initials}</div>
            <span className="settings-name">{userName}</span>
            <span className="settings-chevron">▾</span>
          </div>

          {isMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 290 }}
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="settings-menu">
                <div className="settings-menu-header">
                  <div className="settings-menu-name">{userName.split('@')[0]}</div>
                  <div className="settings-menu-email">{userName}</div>
                </div>

                <button
                  className="settings-menu-item"
                  onClick={() => { setDarkMode(!darkMode); setIsMenuOpen(false); }}
                >
                  <span>{darkMode ? '☀️' : '🌙'}</span>
                  <span style={{ flex: 1 }}>{darkMode ? 'Light mode' : 'Dark mode'}</span>
                  <div className={`toggle-switch ${darkMode ? 'on' : ''}`} style={{ pointerEvents: 'none' }}>
                    <div className="toggle-thumb"></div>
                  </div>
                </button>

                {hasResults && (
                  <button
                    className="settings-menu-item"
                    onClick={() => { downloadCsv(); setIsMenuOpen(false); }}
                  >
                    <span>📥</span>
                    <span>Download report (CSV)</span>
                  </button>
                )}

                <button
                  className="settings-menu-item"
                  onClick={() => { setActivePage('reports'); setIsMenuOpen(false); }}
                >
                  <span>📊</span>
                  <span>View reports</span>
                </button>

                <div className="settings-menu-divider"></div>

                <button
                  className="settings-menu-item danger"
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                >
                  <span>🚪</span>
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
