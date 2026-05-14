import React, { useEffect, useRef, useState } from 'react';

const GraphPage = ({ modules, summary, scanId }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  const hasData = modules.length > 0;

  useEffect(() => {
    if (!hasData || !containerRef.current) return;

    const loadVis = async () => {
      setLoading(true);
      if (!window.vis) {
        await new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      renderGraph();
    };

    loadVis().catch(console.error);
  }, [modules, filter]);

  const renderGraph = () => {
    if (!window.vis || !containerRef.current) return;

    const filtered = filter === 'all'
      ? modules
      : filter === 'high' ? modules.filter(m => m.risk >= 0.7)
      : filter === 'mid' ? modules.filter(m => m.risk >= 0.4 && m.risk < 0.7)
      : modules.filter(m => m.risk < 0.4);

    const modSet = new Set(filtered.map(m => m.module));

    const nodes = filtered.map(m => {
      const pct = Math.round((m.risk || 0) * 100);
      const color = m.risk >= 0.7 ? '#DC2626' : m.risk >= 0.4 ? '#D97706' : '#16A34A';
      const bgColor = m.risk >= 0.7 ? 'rgba(220,38,38,0.12)' : m.risk >= 0.4 ? 'rgba(217,119,6,0.12)' : 'rgba(22,163,74,0.12)';
      const shortName = m.module.split('.').pop();
      return {
        id: m.module,
        label: shortName,
        title: `${m.module}\nRisk: ${pct}%\nIn: ${m.features?.in_degree || 0} | Out: ${m.features?.out_degree || 0} | Cycles: ${m.features?.cycle_count || 0}`,
        color: { background: bgColor, border: color, highlight: { background: bgColor, border: color } },
        font: { color: '#1C1C1C', size: 11, face: 'Inter, sans-serif' },
        borderWidth: m.risk >= 0.7 ? 2 : 1,
        size: 12 + (m.features?.in_degree || 0) * 2 + (m.features?.out_degree || 0),
      };
    });

    // Build edges from features
    const edges = [];
    const edgeSet = new Set();
    filtered.forEach(m => {
      // We can infer edges from out_degree but we need actual connections
      // Using module names to detect potential dependencies
      filtered.forEach(target => {
        if (m.module !== target.module) {
          const sourceParts = m.module.split('.');
          const targetParts = target.module.split('.');
          // Check if they share a parent package (likely connected)
          if (sourceParts[0] === targetParts[0] && sourceParts.length > 1 && targetParts.length > 1) {
            const edgeKey = `${m.module}->${target.module}`;
            if (!edgeSet.has(edgeKey) && edges.length < 200) {
              edgeSet.add(edgeKey);
              edges.push({
                from: m.module,
                to: target.module,
                arrows: { to: { enabled: true, scaleFactor: 0.6 } },
                color: { color: 'rgba(100,100,120,0.35)', highlight: 'var(--primary)' },
                width: 1,
                smooth: { type: 'curvedCW', roundness: 0.1 }
              });
            }
          }
        }
      });
    });

    setNodeCount(nodes.length);
    setEdgeCount(edges.length);

    const data = { nodes: new window.vis.DataSet(nodes), edges: new window.vis.DataSet(edges) };

    const options = {
      layout: { improvedLayout: true },
      physics: {
        enabled: true,
        stabilization: { iterations: 150 },
        barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 120, springConstant: 0.04, damping: 0.15 }
      },
      interaction: { hover: true, tooltipDelay: 150, zoomView: true, dragView: true },
      nodes: { shape: 'dot', scaling: { min: 10, max: 32 } },
      edges: { smooth: true },
      height: '460px'
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }
    networkRef.current = new window.vis.Network(containerRef.current, data, options);
    networkRef.current.once('stabilized', () => setLoading(false));
  };

  const downloadGraphSnapshot = () => {
    if (!networkRef.current) return;
    try {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `dependency-graph-${scanId || 'snapshot'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      alert('Could not capture graph. Try right-clicking the graph to save.');
    }
  };

  if (!hasData) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>🕸️</span></div>
          <h3>No Dependency Data</h3>
          <p>Run a scan from the Dashboard to visualize the module dependency graph here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="graph-container">
        <div className="graph-controls">
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Filter by risk:</span>
          {['all', 'high', 'mid', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: '99px', border: '1px solid',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
                background: filter === f ? 'var(--primary-bg)' : 'var(--bg-base)',
                color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {f === 'all' ? 'All' : f === 'high' ? '🔴 High' : f === 'mid' ? '🟡 Medium' : '🟢 Low'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {nodeCount} nodes · {edgeCount} edges
            </span>
            <button className="download-btn" onClick={downloadGraphSnapshot}>
              📷 Save Snapshot
            </button>
          </div>
        </div>

        <div className="graph-canvas" style={{ position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', zIndex: 5, flexDirection: 'column', gap: '12px' }}>
              <span className="spinner"></span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Building dependency graph…</span>
            </div>
          )}
          <div ref={containerRef} style={{ height: '460px', width: '100%' }}></div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { color: '#DC2626', bg: 'rgba(220,38,38,0.12)', label: 'High Risk (≥70%)' },
            { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Medium Risk (40–70%)' },
            { color: '#16A34A', bg: 'rgba(22,163,74,0.12)', label: 'Low Risk (<40%)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.bg, border: `2px solid ${item.color}` }}></div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            Node size = degree centrality · Scroll to zoom · Drag to pan
          </span>
        </div>
      </div>

      {/* Module list below */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-header"><span className="panel-title">Module Index</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', padding: '4px 0' }}>
          {modules.map(m => {
            const pct = Math.round((m.risk || 0) * 100);
            const color = m.risk >= 0.7 ? 'var(--danger)' : m.risk >= 0.4 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={m.module} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '12px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{m.module}</span>
                <span style={{ color: color, fontWeight: '600' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GraphPage;
