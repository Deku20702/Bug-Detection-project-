import React from 'react';

const ReportsPage = ({ modules, summary, recommendations, scanId, downloadCsv }) => {
  const hasData = modules.length > 0;

  const downloadJson = () => {
    const data = { scanId, summary, modules, recommendations, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-report-${scanId || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!hasData) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>📋</span></div>
          <h3>No Reports Yet</h3>
          <p>Run a scan from the Dashboard to generate reports you can download here.</p>
        </div>
      </div>
    );
  }

  const highCount = modules.filter(m => m.risk >= 0.7).length;
  const midCount = modules.filter(m => m.risk >= 0.4 && m.risk < 0.7).length;
  const lowCount = modules.filter(m => m.risk < 0.4).length;
  const avgRisk = modules.length ? (modules.reduce((s, m) => s + (m.risk || 0), 0) / modules.length * 100).toFixed(1) : 0;

  return (
    <div className="fade-in">
      {/* Report overview card */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header">
          <span className="panel-title">Latest Scan Report</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="download-btn" onClick={downloadCsv}>📥 CSV</button>
            <button className="download-btn" onClick={downloadJson}>📥 JSON</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', padding: '4px 0' }}>
          {[
            { label: 'Scan ID', value: scanId?.substring(0, 12) + '…', color: 'var(--primary)' },
            { label: 'Total Modules', value: summary?.module_count || 0, color: 'var(--text-primary)' },
            { label: 'Avg Risk', value: `${avgRisk}%`, color: avgRisk > 60 ? 'var(--danger)' : avgRisk > 35 ? 'var(--warning)' : 'var(--success)' },
            { label: 'Critical', value: highCount, color: 'var(--danger)' },
            { label: 'Anti-patterns', value: summary?.anti_patterns?.length || 0, color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Scan Summary cards */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Latest Scan Summary — Module Cards
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {modules.slice(0, 12).map(m => {
            const pct = Math.round((m.risk || 0) * 100);
            const level = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
            const levelText = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low';
            const rec = recommendations.find(r => r.module === m.module);
            const cov = Math.max(0, 100 - Math.round(pct * 0.7));
            const vulns = [];
            if (m.features?.cycle_count > 0) vulns.push('Circular dependency');
            if ((m.features?.out_degree || 0) >= 8) vulns.push('High coupling');
            if ((m.features?.in_degree || 0) >= 8) vulns.push('God module');
            return (
              <div key={m.module} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '10px' }}>{m.module}</div>
                  <span className={`risk-chip risk-${level}`}>{levelText}</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase' }}>Risk Level</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: pct >= 70 ? 'var(--danger)' : pct >= 40 ? 'var(--warning)' : 'var(--success)' }}>{pct}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase' }}>Code Coverage</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--info)' }}>{cov}%</div>
                    </div>
                  </div>
                  {vulns.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>Vulnerabilities</div>
                      {vulns.map(v => (
                        <span key={v} style={{ display: 'inline-block', fontSize: '11px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: '4px', padding: '2px 7px', marginRight: '4px', marginBottom: '4px' }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anti-patterns */}
      {summary?.anti_patterns?.length > 0 && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Anti-patterns Detected</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.anti_patterns.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--warning)' }}>⚠</span> {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
