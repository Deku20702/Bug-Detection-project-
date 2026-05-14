import React from 'react';
import TrendChart from '../components/charts/TrendChart';

const TrendsPage = ({ trendData, modules, summary }) => {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>📈</span></div>
          <h3>No Trend Data Yet</h3>
          <p>Run at least two scans on the same repository to generate historical trend data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="metrics-grid" style={{ marginBottom: '16px' }}>
        <div className="metric-card">
          <div className="metric-label">Scans Recorded</div>
          <div className="metric-value">{trendData.length}</div>
          <div className="metric-sub">data points</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Latest Risk</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>
            {trendData[trendData.length - 1]?.highRisk || 0}
          </div>
          <div className="metric-sub">critical modules</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Latest Total</div>
          <div className="metric-value">{trendData[trendData.length - 1]?.total || 0}</div>
          <div className="metric-sub">modules</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Trend</div>
          <div className="metric-value" style={{ fontSize: '18px' }}>
            {trendData.length >= 2
              ? trendData[trendData.length - 1].highRisk > trendData[0].highRisk
                ? '↑ Increasing'
                : trendData[trendData.length - 1].highRisk < trendData[0].highRisk
                  ? '↓ Improving'
                  : '→ Stable'
              : '—'
            }
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header"><span className="panel-title">Risk Trend Over Time</span></div>
        <TrendChart data={trendData} />
      </div>

      {/* Data table */}
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Scan History</span></div>
        <table className="mod-table">
          <thead>
            <tr>
              <th>Time</th>
              <th style={{ textAlign: 'right' }}>Total Modules</th>
              <th style={{ textAlign: 'right' }}>Critical Risks</th>
              <th style={{ textAlign: 'right' }}>Risk Rate</th>
            </tr>
          </thead>
          <tbody>
            {[...trendData].reverse().map((point, i) => {
              const rate = point.total > 0 ? ((point.highRisk / point.total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={i}>
                  <td>{point.time}</td>
                  <td style={{ textAlign: 'right' }}>{point.total}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="risk-chip risk-high">{point.highRisk}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`risk-chip risk-${Number(rate) > 30 ? 'high' : Number(rate) > 15 ? 'mid' : 'low'}`}>{rate}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendsPage;
