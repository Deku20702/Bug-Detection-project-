import React, { useState } from 'react';

const RecommendationsPage = ({ recommendations, modules, onModuleClick }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (!recommendations.length) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>💡</span></div>
          <h3>No Recommendations</h3>
          <p>Run a scan from the Dashboard to generate AI-powered fix recommendations.</p>
        </div>
      </div>
    );
  }

  const filtered = recommendations.filter(r => {
    if (filter !== 'all' && r.severity !== filter) return false;
    if (search && !r.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  recommendations.forEach(r => { if (counts[r.severity] !== undefined) counts[r.severity]++; });

  return (
    <div className="fade-in">
      {/* Filter bar */}
      <div className="panel" style={{ marginBottom: '16px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
            placeholder="Search modules…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: '99px', border: '1px solid',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
                background: filter === f ? 'var(--primary-bg)' : 'var(--bg-base)',
                color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && counts[f] > 0 && <span style={{ marginLeft: '5px', opacity: 0.7 }}>({counts[f]})</span>}
            </button>
          ))}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((r, i) => {
          const m = modules.find(mod => mod.module === r.module);
          const pct = m ? Math.round((m.risk || 0) * 100) : 0;
          const sevColor = r.severity === 'critical' ? 'var(--danger)' : r.severity === 'high' ? 'var(--primary)' : r.severity === 'medium' ? 'var(--warning)' : 'var(--success)';
          const sevBg = r.severity === 'critical' ? 'var(--danger-bg)' : r.severity === 'high' ? 'var(--primary-bg)' : r.severity === 'medium' ? 'var(--warning-bg)' : 'var(--success-bg)';
          const sevBorder = r.severity === 'critical' ? 'var(--danger-border)' : r.severity === 'high' ? 'var(--primary-border)' : r.severity === 'medium' ? 'var(--warning-border)' : 'var(--success-border)';

          return (
            <div
              key={i}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-light)', background: sevBg }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{r.module}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '99px', background: sevBg, color: sevColor, border: `1px solid ${sevBorder}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {r.severity}
                    </span>
                    {pct > 0 && <span className={`risk-chip risk-${pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low'}`}>{pct}% risk</span>}
                  </div>
                </div>
                <button
                  onClick={() => m && onModuleClick(m)}
                  style={{ padding: '6px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  View Details →
                </button>
              </div>

              <div style={{ padding: '16px 18px' }}>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.65', marginBottom: '14px' }}>
                  {r.explanation}
                </p>

                {r.actions && r.actions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                      Recommended Actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {r.actions.map((action, j) => (
                        <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>
                            {j + 1}
                          </span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {r.evidence && r.evidence.length > 0 && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Code Evidence</div>
                    {r.evidence.slice(0, 3).map((ev, k) => (
                      <div key={k} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '6px' }}>
                        <div style={{ padding: '4px 10px', background: 'var(--bg-surface2)', borderBottom: '1px solid var(--border)', fontSize: '10.5px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>Line {ev.line}</div>
                        <pre style={{ margin: 0, padding: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', overflowX: 'auto', fontFamily: 'monospace', lineHeight: '1.5' }}>
                          <code>{ev.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsPage;
