import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TrendChart = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-tertiary)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '28px', height: '28px', marginBottom: '8px', opacity: 0.5 }}>
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 9l-5 5-4-4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: '13px' }}>Run one more scan to generate a trendline.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '220px', width: '100%', marginTop: '12px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
          <XAxis dataKey="time" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '12px'
            }}
            itemStyle={{ fontSize: '12px', fontWeight: '500' }}
            labelStyle={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
          <Line type="monotone" name="Total Modules" dataKey="total" stroke="var(--info)" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: 'var(--info)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
          <Line type="monotone" name="Critical Risks" dataKey="highRisk" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
