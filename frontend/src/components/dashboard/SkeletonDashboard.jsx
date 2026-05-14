import React, { useState, useEffect } from 'react';

const steps = [
  "Initializing scan...",
  "Cloning repository data...",
  "Parsing Python AST...",
  "Mapping module dependencies...",
  "Running ML risk scoring...",
  "Generating AI recommendations...",
  "Finalizing structural report..."
];

export const ProgressSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => prev < steps.length - 1 ? prev + 1 : prev);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', padding: '10px 0' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700' }}>
        Analyzing Repository
      </h3>
      <div className="progress-steps">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <div key={i} className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-circle">
                {isDone ? '✓' : i + 1}
              </div>
              <span className="step-text">{step}</span>
              {isActive && <span className="loader" style={{ marginLeft: 'auto', borderColor: 'rgba(155,17,30,0.3)', borderBottomColor: 'var(--primary)' }}></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SkeletonBox = ({ height, width = '100%', borderRadius = '8px', marginBottom = '0' }) => (
  <div className="skeleton" style={{ height, width, borderRadius, marginBottom }} />
);

const SkeletonDashboard = () => (
  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
    <div style={{
      position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
      background: 'rgba(245,246,250,0.75)', backdropFilter: 'blur(6px)',
      zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 'var(--radius-xl)'
    }}>
      <div style={{ background: 'var(--bg-surface)', padding: '28px 36px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
        <ProgressSteps />
      </div>
    </div>
    <div className="metrics-grid" style={{ opacity: 0.5 }}>
      {[1,2,3,4].map(i => (
        <div className="metric-card" key={i}>
          <SkeletonBox height="11px" width="40%" marginBottom="14px" />
          <SkeletonBox height="26px" width="55%" marginBottom="8px" />
          <SkeletonBox height="10px" width="30%" />
        </div>
      ))}
    </div>
    <div className="main-grid" style={{ opacity: 0.5 }}>
      <div className="panel" style={{ height: '240px' }}><SkeletonBox height="100%" /></div>
      <div className="panel" style={{ height: '240px' }}><SkeletonBox height="100%" /></div>
    </div>
    <div className="panel" style={{ height: '280px', opacity: 0.5 }}><SkeletonBox height="100%" /></div>
  </div>
);

export default SkeletonDashboard;
