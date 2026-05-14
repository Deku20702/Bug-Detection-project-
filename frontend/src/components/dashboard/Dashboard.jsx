import React, { useState, useRef } from 'react';
import client from '../../api';
import ModuleTable from './ModuleTable';
import RiskDonut from '../charts/RiskDonut';
import TrendChart from '../charts/TrendChart';
import SidePanel from './SidePanel';
import SkeletonDashboard from './SkeletonDashboard';
import toast from 'react-hot-toast';

function riskColor(r) {
  if (r >= 0.7) return "#DC2626";
  if (r >= 0.4) return "#D97706";
  return "#16A34A";
}

function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(rows, recommendations, summary, scanId) {
  const recMap = new Map((recommendations || []).map(item => [item.module, item]));
  const header = "scan_id,module,risk,severity,in_degree,out_degree,cycle_count,explanation";
  const body = (rows || []).map(row => {
    const rec = recMap.get(row.module);
    return [scanId, row.module, row.risk, rec?.severity || "", row.features?.in_degree || 0, row.features?.out_degree || 0, row.features?.cycle_count || 0, rec?.explanation || ""].map(escapeCsv).join(",");
  }).join("\n");
  return `${header}\n${body}`;
}

function extractRepoName(url) {
  if (!url) return "project";
  const clean = url.replace(/\/$/, "");
  if (clean.includes("github.com/")) {
    const parts = clean.split("github.com/")[1].split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1].replace('.git', '')}`;
  }
  return clean.split("/").pop().replace('.git', '') || "project";
}

const getPatternColor = (i) => {
  const colors = ["var(--danger)", "var(--warning)", "var(--success)", "var(--info)", "#8b5cf6"];
  return colors[i % colors.length];
};

const Dashboard = ({ userName, initials, summary, setSummary, modules, setModules, recommendations, setRecommendations, scanId, setScanId, repoUrl, setRepoUrl, isScanning, setIsScanning, trendData, setTrendData, scanHistory, setScanHistory, historyKey, loadFromHistory, downloadCsv }) => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelContext, setPanelContext] = useState('module');
  const [showAllRecs, setShowAllRecs] = useState(false);
  const searchInputRef = useRef(null);

  const handleRowClick = (moduleData) => {
    setSelectedModule(moduleData);
    setPanelContext('module');
    setIsPanelOpen(true);
  };

  const handleRecClick = (moduleName) => {
    const target = modules.find(m => m.module === moduleName);
    setSelectedModule(target || { module: moduleName, risk: 1 });
    setPanelContext('recommendation');
    setIsPanelOpen(true);
  };

  const startScan = async () => {
    if (!repoUrl) { toast.error("Please enter a repository URL."); return; }
    setIsScanning(true);
    setSummary(null); setModules([]); setRecommendations([]); setScanId(""); setIsPanelOpen(false);
    try {
      const cleanName = extractRepoName(repoUrl);
      const uniqueName = `${cleanName}-${Math.floor(Date.now() / 1000)}`;
      const response = await client.post("/projects", { name: uniqueName, repo_url: repoUrl, language: "python" });
      const projectId = response.data.project_id;
      const scanRes = await client.post("/scans/start", { project_id: projectId });
      const id = scanRes.data.scan_id;
      const [summaryRes, modulesRes, recRes] = await Promise.all([
        client.get(`/scans/${id}/summary`),
        client.get(`/scans/${id}/modules`),
        client.get(`/scans/${id}/recommendations`)
      ]);
      setScanId(id);
      setSummary(summaryRes.data);
      setModules(modulesRes.data || []);
      setRecommendations(recRes.data || []);
      localStorage.setItem("recent_scan_data", JSON.stringify({ scanId: id, summary: summaryRes.data, modules: modulesRes.data || [], recommendations: recRes.data || [] }));
      const trendKey = `trend_${cleanName}`;
      const prevTrend = JSON.parse(localStorage.getItem(trendKey) || "[]");
      const newPoint = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), highRisk: summaryRes.data.high_risk_modules || 0, total: summaryRes.data.module_count || 0 };
      const updatedTrend = [...prevTrend, newPoint].slice(-15);
      localStorage.setItem(trendKey, JSON.stringify(updatedTrend));
      setTrendData(updatedTrend);
      const newItem = { name: cleanName, repo_url: repoUrl };
      setScanHistory(prev => {
        const updated = [newItem, ...prev.filter(i => i.repo_url !== repoUrl)].slice(0, 5);
        localStorage.setItem(historyKey, JSON.stringify(updated));
        return updated;
      });
      toast.success("Scan completed — rendering results.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Scan failed. Check the repo URL and backend.");
      setSummary(null); setModules([]); setRecommendations([]);
      localStorage.removeItem("recent_scan_data");
    } finally {
      setIsScanning(false);
    }
  };

  const hasResults = !!summary && modules.length > 0;

  return (
    <>
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        moduleData={selectedModule}
        recommendation={recommendations.find(r => r.module === selectedModule?.module)}
        context={panelContext}
      />

      {/* SCAN INPUT */}
      <div className="scan-input-wrap">
        <div className="scan-row">
          <input
            ref={searchInputRef}
            className="scan-input"
            placeholder="Enter a GitHub repo URL or local path..."
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            disabled={isScanning}
            onKeyDown={e => e.key === 'Enter' && startScan()}
          />
          <button className="scan-btn" onClick={startScan} disabled={isScanning}>
            {isScanning ? <span className="loader"></span> : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '14px', height: '14px' }}>
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
            )}
            {isScanning ? "Scanning..." : "Start Scan"}
          </button>
        </div>

        {scanHistory.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Recent:</span>
            {scanHistory.map(item => (
              <span
                key={item.repo_url}
                onClick={() => loadFromHistory(item)}
                style={{ padding: '3px 10px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.target.style.background = 'var(--primary-bg)'; e.target.style.color = 'var(--primary)'; e.target.style.borderColor = 'var(--primary-border)'; }}
                onMouseLeave={e => { e.target.style.background = 'var(--bg-surface2)'; e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--border)'; }}
              >
                {item.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      {isScanning ? (
        <SkeletonDashboard />
      ) : !hasResults ? (
        <div className="empty-state">
          <div className="empty-content">
            <div className="scan-radar">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
                <path d="M2 12h3l3 -9 5 18 3 -9h5" />
              </svg>
            </div>
            <h3>Awaiting Repository</h3>
            <p>Paste a GitHub URL or local path above to map module dependencies, detect anti-patterns, and calculate structural risk.</p>
          </div>
        </div>
      ) : (
        <div className="fade-in">

          {/* QUALITY GATE */}
          <div className={`quality-gate ${summary?.high_risk_modules > 0 ? 'failed' : 'passed'}`}>
            <div>
              <h3>
                Quality Gate Status
                <span className={`gate-badge ${summary?.high_risk_modules > 0 ? 'failed' : 'passed'}`}>
                  {summary?.high_risk_modules > 0 ? 'Failed' : 'Passed'}
                </span>
              </h3>
              <p>
                {summary?.high_risk_modules > 0
                  ? `Warning: ${summary.high_risk_modules} critical structural risk(s) detected. Refactoring required before deployment.`
                  : 'No critical structural risks detected in this repository.'}
              </p>
            </div>
            <span style={{ fontSize: '28px' }}>{summary?.high_risk_modules > 0 ? '⚠️' : '🛡️'}</span>
          </div>

          {/* METRICS */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Modules</div>
              <div className="metric-value">{summary?.module_count || 0}</div>
              <div className="metric-sub">{summary?.edge_count || 0} edges</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">High Risk</div>
              <div className="metric-value" style={{ color: 'var(--danger)' }}>{summary?.high_risk_modules || 0}</div>
              <div className="metric-sub"><span className="risk-chip risk-high">critical</span></div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Python Files</div>
              <div className="metric-value">{summary?.analyzer_stats?.total_python_files || 0}</div>
              <div className="metric-sub"><span className="risk-chip risk-low">{summary?.analyzer_stats?.parseable_python_files || 0} parseable</span></div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Scan ID</div>
              <div className="metric-value" style={{ fontSize: '13px', paddingTop: '4px', wordBreak: 'break-all' }}>{scanId}</div>
              <div className="metric-sub">just now</div>
            </div>
          </div>

          {/* TOP ROW */}
          <div className="main-grid">
            {/* Bar chart */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Module Risk (top 8)</span>
              </div>
              <div className="bar-list">
                {modules.slice(0, 8).map(m => {
                  const pct = Math.round((m.risk || 0) * 100);
                  return (
                    <div className="bar-row" key={m.module}>
                      <span className="bar-label" title={m.module}>{m.module.split('.').pop()}</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: riskColor(m.risk) }}></div></div>
                      <span className="bar-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <span className="panel-title">Recommendations</span>
                <span className="risk-chip risk-high">{recommendations.length}</span>
              </div>
              <div className="rec-list" style={{ overflowY: showAllRecs ? 'auto' : 'hidden', maxHeight: showAllRecs ? '400px' : 'none', flex: 1 }}>
                {recommendations.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '10px 0' }}>No critical recommendations found.</div>
                ) : (showAllRecs ? recommendations : recommendations.slice(0, 3)).map((r, i) => {
                  const icons = ["⚠️", "🔗", "🔄"];
                  const bgColors = ["var(--danger-bg)", "var(--warning-bg)", "var(--info-bg)"];
                  const textColors = ["var(--danger)", "var(--warning)", "var(--info)"];
                  return (
                    <div className="rec-item" key={i} onClick={() => handleRecClick(r.module)}>
                      <div className="rec-icon" style={{ background: bgColors[i % 3], color: textColors[i % 3] }}>{icons[i % 3]}</div>
                      <div className="rec-body">
                        <div className="rec-title">{r.module}</div>
                        <div className="rec-desc">{r.explanation?.substring(0, 100)}…</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {recommendations.length > 3 && (
                <button
                  onClick={() => setShowAllRecs(!showAllRecs)}
                  style={{ marginTop: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', borderRadius: 'var(--radius-md)', width: '100%', padding: '9px 0', transition: 'background 0.15s', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => e.target.style.background = 'var(--bg-surface2)'}
                  onMouseLeave={e => e.target.style.background = 'var(--bg-base)'}
                >
                  {showAllRecs ? 'Collapse ↑' : `View all ${recommendations.length} →`}
                </button>
              )}
            </div>
          </div>

          {/* BOTTOM ROW: ANTI-PATTERNS + DONUT */}
          <div className="bottom-row">
            <div className="panel">
              <div className="panel-header"><span className="panel-title">Anti-patterns Detected</span></div>
              <div className="pattern-list">
                {!summary?.anti_patterns?.length ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No known anti-patterns matched.</div>
                ) : summary.anti_patterns.map((p, i) => (
                  <div className="pattern-item" key={i}>
                    <div className="pattern-dot" style={{ background: getPatternColor(i) }}></div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}><span className="panel-title">File Coverage</span></div>
                <div className="file-stats">
                  <div className="file-row"><span className="file-key">Total Python files</span><span className="file-val">{summary?.analyzer_stats?.total_python_files || 0}</span></div>
                  <div className="file-row"><span className="file-key">Parseable</span><span className="file-val">{summary?.analyzer_stats?.parseable_python_files || 0}</span></div>
                  <div className="file-row"><span className="file-key">Skipped</span><span className="file-val">{summary?.analyzer_stats?.skipped_python_files || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="panel-title">Risk Distribution</span></div>
              <RiskDonut modules={modules} summary={summary} />
              <div style={{ marginTop: '18px' }}>
                <button className="download-btn" onClick={downloadCsv} style={{ width: '100%', justifyContent: 'center' }}>
                  📥 Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* TREND CHART */}
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="panel-header"><span className="panel-title">Historical Risk Trend</span></div>
            <TrendChart data={trendData} />
          </div>

          {/* MODULE TABLE */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Module Table</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Click row for details</span>
            </div>
            <ModuleTable modules={modules} onRowClick={handleRowClick} />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
