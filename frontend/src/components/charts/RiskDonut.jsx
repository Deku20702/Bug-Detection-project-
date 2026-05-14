import React, { useMemo } from 'react';

const RiskDonut = ({ modules, summary }) => {
  const data = useMemo(() => {
    if (!modules || !modules.length) return null;
    const total = summary?.module_count || modules.length || 1;
    const h = summary?.high_risk_modules || modules.filter(m => m.risk >= 0.7).length;
    const m = modules.filter(m => m.risk >= 0.4 && m.risk < 0.7).length;
    const l = modules.filter(m => m.risk < 0.4).length;
    const circum = 2 * Math.PI * 36;
    const hDash = (h / total) * circum;
    const mDash = (m / total) * circum;
    const lDash = (l / total) * circum;
    return {
      total, h, hPct: Math.round((h/total)*100)||0, hDash,
      m, mPct: Math.round((m/total)*100)||0, mDash, mOff: -hDash,
      l, lPct: Math.round((l/total)*100)||0, lDash, lOff: -(hDash + mDash)
    };
  }, [modules, summary]);

  if (!data) return <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No data</div>;

  return (
    <div className="donut-wrap">
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--bg-surface3)" strokeWidth="13"/>
        {data.h > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#DC2626" strokeWidth="13"
          strokeDasharray={`${data.hDash} 226`} strokeDashoffset="0" transform="rotate(-90 50 50)"/>}
        {data.m > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#D97706" strokeWidth="13"
          strokeDasharray={`${data.mDash} 226`} strokeDashoffset={data.mOff} transform="rotate(-90 50 50)"/>}
        {data.l > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#16A34A" strokeWidth="13"
          strokeDasharray={`${data.lDash} 226`} strokeDashoffset={data.lOff} transform="rotate(-90 50 50)"/>}
        <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)">{data.total}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">total</text>
      </svg>
      <div className="donut-legend">
        <div className="legend-item"><div className="legend-swatch" style={{background:"#DC2626"}}></div>High — {data.h} ({data.hPct}%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{background:"#D97706"}}></div>Medium — {data.m} ({data.mPct}%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{background:"#16A34A"}}></div>Low — {data.l} ({data.lPct}%)</div>
      </div>
    </div>
  );
};

export default RiskDonut;
