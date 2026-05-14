import React from 'react';
import RiskDonut from '../charts/RiskDonut';
import TrendChart from '../charts/TrendChart';

const AnalysisPage = ({ modules, summary, recommendations, trendData, onModuleClick }) => {
  const hasData = modules.length > 0;

  if (!hasData) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar">
            <span style={{ fontSize: '24px' }}>🔍</span>
          </div>
          <h3>No Analysis Data</h3>
          <p>Run a scan from the Dashboard to see detailed analysis results here.</p>
        </div>
      </div>
    );
  }

  const highMods = modules.filter(m => m.risk >= 0.7);
  const midMods = modules.filter(m => m.risk >= 0.4 && m.risk < 0.7);
  const lowMods = modules.filter(m => m.risk < 0.4);

  return (
    <div className="fade-in">
      {/* Summary cards */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="metric-label">High Risk Modules</div>
          <div className="metric-value" style={{ color: 'var(--danger)' }}>{highMods.length}</div>
          <div className="metric-sub">Require immediate attention</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div className="metric-label">Medium Risk</div>
          <div className="metric-value" style={{ color: 'var(--warning)' }}>{midMods.length}</div>
          <div className="metric-sub">Should be reviewed</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="metric-label">Low Risk</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>{lowMods.length}</div>
          <div className="metric-sub">Structurally sound</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="metric-label">AI Recommendations</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>{recommendations.length}</div>
          <div className="metric-sub">Action items generated</div>
        </div>
      </div>

      <div className="analysis-grid">
        {/* Risk Donut + breakdown */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Severity Distribution</span></div>
          <RiskDonut modules={modules} summary={summary} />
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakdown</div>
            {[
              { label: 'High Risk (≥70%)', count: highMods.length, color: 'var(--danger)', bg: 'var(--danger-bg)' },
              { label: 'Medium Risk (40–70%)', count: midMods.length, color: 'var(--warning)', bg: 'var(--warning-bg)' },
              { label: 'Low Risk (<40%)', count: lowMods.length, color: 'var(--success)', bg: 'var(--success-bg)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: row.color, background: row.bg, padding: '2px 8px', borderRadius: '99px' }}>{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ML Risk insights */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">ML Risk Scoring</span></div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>
            Risk scores are computed using a sigmoid-activated linear model weighted by:
          </div>
          {[
            { factor: 'In-degree centrality', weight: '0.08', desc: 'Modules imported by many others' },
            { factor: 'Out-degree coupling', weight: '0.09', desc: 'Modules with many outgoing deps' },
            { factor: 'Betweenness centrality', weight: '1.70', desc: 'Critical bridge modules in graph' },
            { factor: 'Cycle participation', weight: '0.25', desc: 'Modules in circular dependency chains' },
            { factor: 'LOC proxy', weight: '0.0035', desc: 'Estimated lines of code complexity' },
          ].map(row => (
            <div key={row.factor} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 8px', borderRadius: '99px', flexShrink: 0, marginTop: '1px' }}>×{row.weight}</span>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{row.factor}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>{row.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header"><span className="panel-title">Historical Risk Trend</span></div>
        <TrendChart data={trendData} />
      </div>

      {/* Top risky modules list */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">High-Risk Module Details</span>
          <span className="risk-chip risk-high">{highMods.length} critical</span>
        </div>
        {highMods.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No high-risk modules found. 🎉</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
            {highMods.map(m => {
              const pct = Math.round((m.risk || 0) * 100);
              return (
                <div
                  key={m.module}
                  onClick={() => onModuleClick(m)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--danger)', width: '44px', flexShrink: 0 }}>{pct}%</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{m.module}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      In: {m.features?.in_degree || 0} · Out: {m.features?.out_degree || 0} · Cycles: {m.features?.cycle_count || 0}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>View →</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
