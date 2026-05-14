import React, { useState, useEffect } from 'react';
import client from '../api';

const ProjectsPage = ({ setRepoUrl, setActivePage }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/projects')
      .then(res => setProjects(res.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>📁</span></div>
          <h3>No Projects Yet</h3>
          <p>Scan a GitHub repository from the Dashboard to see your projects here.</p>
          <button
            onClick={() => setActivePage('dashboard')}
            style={{ marginTop: '16px', padding: '10px 22px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {projects.map((p, i) => (
          <div key={p.id || i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              📦
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.repo_url}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <span style={{ padding: '3px 10px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '11px', color: 'var(--text-secondary)' }}>{p.language || 'python'}</span>
              <button
                onClick={() => { setRepoUrl(p.repo_url); setActivePage('dashboard'); }}
                style={{ padding: '6px 14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                Re-scan →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
