import React from 'react';

const SidePanel = ({ isOpen, onClose, moduleData, recommendation, context = 'module' }) => {
  if (!isOpen && !moduleData) return null;
  const pct = moduleData ? Math.round((moduleData.risk || 0) * 100) : 0;
  const isRecMode = context === 'recommendation';

  const riskColor = pct >= 70 ? 'var(--danger)' : pct >= 40 ? 'var(--warning)' : 'var(--success)';

  const renderStats = () => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
        Structural Assessment
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <span style={{ fontSize: '32px', fontWeight: '800', color: riskColor }}>{pct}%</span>
        <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: pct >= 70 ? 'var(--danger-bg)' : pct >= 40 ? 'var(--warning-bg)' : 'var(--success-bg)', color: riskColor, border: `1px solid ${pct >= 70 ? 'var(--danger-border)' : pct >= 40 ? 'var(--warning-border)' : 'var(--success-border)'}` }}>
          {pct >= 70 ? 'High Risk' : pct >= 40 ? 'Medium Risk' : 'Low Risk'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'In-Degree', val: moduleData?.features?.in_degree || 0 },
          { label: 'Out-Degree', val: moduleData?.features?.out_degree || 0 },
          { label: 'Cycles', val: moduleData?.features?.cycle_count || 0 },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{stat.val}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendation = () => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
        AI Analysis & Recommendations
      </h4>
      {recommendation ? (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
            {recommendation.explanation}
          </div>
          {recommendation.actions && recommendation.actions.length > 0 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--danger-border)', background: 'rgba(220,38,38,0.04)' }}>
              <h5 style={{ fontSize: '11px', color: 'var(--danger)', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Actions</h5>
              {recommendation.actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{i + 1}.</span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}
          {recommendation.evidence && recommendation.evidence.length > 0 && (
            <div style={{ borderTop: '1px solid var(--danger-border)', padding: '14px 16px', background: 'rgba(220,38,38,0.04)' }}>
              <h5 style={{ fontSize: '11px', color: 'var(--danger)', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code Evidence</h5>
              {recommendation.evidence.map((ev, i) => (
                <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ padding: '5px 10px', background: 'var(--bg-surface2)', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    Line {ev.line}
                  </div>
                  <pre style={{ margin: 0, padding: '10px 12px', fontSize: '11.5px', color: 'var(--text-primary)', overflowX: 'auto', fontFamily: 'monospace', lineHeight: '1.5' }}>
                    <code>{ev.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)', fontSize: '13.5px', border: '1px solid var(--border)' }}>
          No critical structural issues detected for this module.
        </div>
      )}
    </div>
  );

  return (
    <>
      {isOpen && <div className="side-panel-overlay" onClick={onClose} />}
      <div className="side-panel" style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        {moduleData && (
          <>
            <div className="side-panel-header">
              <div>
                <div className="side-panel-label">{isRecMode ? 'Recommendation Focus' : 'Module Details'}</div>
                <div className="side-panel-title">{moduleData.module}</div>
              </div>
              <button className="side-panel-close" onClick={onClose}>×</button>
            </div>
            <div className="side-panel-body">
              {isRecMode
                ? <>{renderRecommendation()}{renderStats()}</>
                : <>{renderStats()}{renderRecommendation()}</>
              }
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SidePanel;
