import React from 'react';

const MiniBar = ({ value, color }) => (
  <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface3)', borderRadius: '99px', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '99px' }}></div>
  </div>
);

const Sidebar = ({ activePage, setActivePage, modules, summary, scanHistory, loadFromHistory, repoUrl }) => {
  const navLinks = [
    { key: 'analysis', icon: '🔍', label: 'Analysis' },
    { key: 'reports', icon: '📋', label: 'Reports' },
    { key: 'recommendations', icon: '💡', label: 'Recommendations' },
    { key: 'trends', icon: '📈', label: 'Historical Trends' },
    { key: 'graph', icon: '🕸️', label: 'Dependency Graph' },
    { key: 'modules', icon: '📦', label: 'Module Table' },
  ];

  const top5 = modules.slice(0, 5);
  const highCount = modules.filter(m => m.risk >= 0.7).length;
  const midCount = modules.filter(m => m.risk >= 0.4 && m.risk < 0.7).length;
  const lowCount = modules.filter(m => m.risk < 0.4).length;
  const total = modules.length || 1;

  return (
    <aside className="sidebar">
      {/* Navigation */}
      <div>
        <div className="sidebar-section-title">Navigation</div>
        <div className="sidebar-nav">
          {navLinks.map(link => (
            <button
              key={link.key}
              className={`sidebar-link ${activePage === link.key ? 'active' : ''}`}
              onClick={() => setActivePage(link.key)}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Charts */}
      {modules.length > 0 && (
        <div>
          <div className="sidebar-section-title">Risk Overview</div>
          <div className="sidebar-charts">
            <div className="sidebar-chart-item">
              <div className="sidebar-chart-title">Severity Split</div>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
                <div style={{ flex: highCount, height: '8px', background: 'var(--danger)', borderRadius: '3px 0 0 3px' }}></div>
                <div style={{ flex: midCount, height: '8px', background: 'var(--warning)' }}></div>
                <div style={{ flex: Math.max(lowCount, 1), height: '8px', background: 'var(--success)', borderRadius: '0 3px 3px 0' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <span style={{ color: 'var(--danger)' }}>H:{highCount}</span>
                <span style={{ color: 'var(--warning)' }}>M:{midCount}</span>
                <span style={{ color: 'var(--success)' }}>L:{lowCount}</span>
              </div>
            </div>

            {top5.length > 0 && (
              <div className="sidebar-chart-item">
                <div className="sidebar-chart-title">Top Risk Modules</div>
                {top5.map(m => {
                  const pct = Math.round((m.risk || 0) * 100);
                  const color = pct >= 70 ? 'var(--danger)' : pct >= 40 ? 'var(--warning)' : 'var(--success)';
                  const short = m.module.split('.').pop();
                  return (
                    <div key={m.module} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', width: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short}</span>
                      <MiniBar value={pct} color={color} />
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', width: '24px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Repos */}
      {scanHistory.length > 0 && (
        <div>
          <div className="sidebar-section-title">Recent Repos</div>
          <select
            className="sidebar-repo-selector"
            value={repoUrl}
            onChange={e => {
              const item = scanHistory.find(h => h.repo_url === e.target.value);
              if (item) loadFromHistory(item);
            }}
          >
            <option value="">Select a repo…</option>
            {scanHistory.map(item => (
              <option key={item.repo_url} value={item.repo_url}>{item.name}</option>
            ))}
          </select>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
