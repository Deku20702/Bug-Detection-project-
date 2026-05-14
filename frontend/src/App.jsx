import React, { useState, useEffect } from "react";
import { setAuthToken } from "./api";
import LoginScreen from "./components/auth/LoginScreen";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import Dashboard from "./components/dashboard/Dashboard";
import SidePanel from "./components/dashboard/SidePanel";
import AnalysisPage from "./pages/AnalysisPage";
import GraphPage from "./pages/GraphPage";
import ReportsPage from "./pages/ReportsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import TrendsPage from "./pages/TrendsPage";
import ProjectsPage from "./pages/ProjectsPage";
import ModulesPage from "./pages/ModulesPage";
import { Toaster } from "react-hot-toast";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("app_token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("app_email") || "");
  const [activePage, setActivePage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  // Global scan data shared across pages
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem("recent_scan_data");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  };
  const cachedData = loadCachedData();

  const [repoUrl, setRepoUrl] = useState("");
  const [scanId, setScanId] = useState(cachedData?.scanId || "");
  const [summary, setSummary] = useState(cachedData?.summary || null);
  const [modules, setModules] = useState(cachedData?.modules || []);
  const [recommendations, setRecommendations] = useState(cachedData?.recommendations || []);
  const [isScanning, setIsScanning] = useState(false);
  const [trendData, setTrendData] = useState([]);

  const historyKey = `scan_history_${userEmail}`;
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const hist = localStorage.getItem(`scan_history_${localStorage.getItem("app_email") || ""}`);
      return hist ? JSON.parse(hist) : [];
    } catch { return []; }
  });

  // Side panel shared state for analysis page
  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  // Apply/remove dark mode body class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.style.setProperty('--bg-base', '#09090b');
      document.documentElement.style.setProperty('--bg-surface', '#141417');
      document.documentElement.style.setProperty('--bg-surface2', '#212128');
      document.documentElement.style.setProperty('--bg-surface3', '#19191d');
      document.documentElement.style.setProperty('--border', '#333338');
      document.documentElement.style.setProperty('--border-light', '#27272a');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#a1a1aa');
      document.documentElement.style.setProperty('--text-tertiary', '#71717a');
      document.documentElement.style.setProperty('--accent', '#0a0a0b');
    } else {
      document.documentElement.style.setProperty('--bg-base', '#F5F6FA');
      document.documentElement.style.setProperty('--bg-surface', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-surface2', '#F0F1F7');
      document.documentElement.style.setProperty('--bg-surface3', '#E8EAF2');
      document.documentElement.style.setProperty('--border', '#E0E2EE');
      document.documentElement.style.setProperty('--border-light', '#ECEEF6');
      document.documentElement.style.setProperty('--text-primary', '#1C1C1C');
      document.documentElement.style.setProperty('--text-secondary', '#5A5D72');
      document.documentElement.style.setProperty('--text-tertiary', '#9097B0');
      document.documentElement.style.setProperty('--accent', '#1C1C1C');
    }
  }, [darkMode]);

  const handleLogout = () => {
    setToken(""); setAuthToken(""); setUserEmail("");
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_email");
    localStorage.removeItem("recent_scan_data");
  };

  const handleLoginSuccess = (newToken, email) => {
    setToken(newToken); setUserEmail(email);
    localStorage.setItem("app_token", newToken);
    localStorage.setItem("app_email", email);
  };

  const loadFromHistory = (item) => {
    setRepoUrl(item.repo_url);
    const trendKey = `trend_${item.repo_url.split('github.com/')[1]?.replace('.git', '') || item.name}`;
    try {
      const savedTrend = JSON.parse(localStorage.getItem(trendKey) || "[]");
      setTrendData(savedTrend);
    } catch { setTrendData([]); }
  };

  function escapeCsv(value) {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
  }

  const downloadCsv = () => {
    const recMap = new Map((recommendations || []).map(r => [r.module, r]));
    const header = "scan_id,module,risk,severity,in_degree,out_degree,cycle_count,explanation";
    const body = (modules || []).map(row => {
      const rec = recMap.get(row.module);
      return [scanId, row.module, row.risk, rec?.severity || "", row.features?.in_degree || 0, row.features?.out_degree || 0, row.features?.cycle_count || 0, rec?.explanation || ""].map(escapeCsv).join(",");
    }).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scan_${scanId || "results"}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "US";
  const userName = userEmail || "User";

  const pageTitles = {
    dashboard: { tag: 'AI Architecture Intelligence', title: 'Structural Bug Detection', sub: 'FastAPI · ML · AI-powered recommendations' },
    projects: { tag: 'Repository Management', title: 'Projects', sub: 'Your scanned GitHub repositories' },
    analysis: { tag: 'Deep Analysis', title: 'Code Analysis', sub: 'ML risk scoring & vulnerability breakdown' },
    reports: { tag: 'Export & Reports', title: 'Scan Reports', sub: 'Download and review scan results' },
    recommendations: { tag: 'AI Insights', title: 'Recommendations', sub: 'AI-generated fix recommendations' },
    trends: { tag: 'Historical Data', title: 'Historical Trends', sub: 'Risk evolution over multiple scans' },
    graph: { tag: 'Dependency Visualization', title: 'Dependency Graph', sub: 'Module dependency network visualization' },
    modules: { tag: 'Module Details', title: 'Module Table', sub: 'Complete list of all analyzed modules' },
  };

  const pageInfo = pageTitles[activePage] || pageTitles.dashboard;

  if (!token) {
    return (
      <>
        <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px' } }} />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#fff', color: '#1C1C1C', border: '1px solid #E0E2EE', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }} />

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        moduleData={selectedModule}
        recommendation={recommendations.find(r => r.module === selectedModule?.module)}
        context="module"
      />

      <div className="app-shell">
        <Navbar
          userName={userName}
          initials={initials}
          handleLogout={handleLogout}
          activePage={activePage}
          setActivePage={setActivePage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          hasResults={!!summary && modules.length > 0}
          downloadCsv={downloadCsv}
        />

        <div className="main-body">
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            modules={modules}
            summary={summary}
            scanHistory={scanHistory}
            loadFromHistory={loadFromHistory}
            repoUrl={repoUrl}
          />

          <main className="main-content">
            {/* Page Header */}
            <div className="page-header">
              <div className="page-tag">
                <div className="tag-dot"></div>
                {pageInfo.tag}
              </div>
              <div className="page-title">{pageInfo.title}</div>
              <div className="page-subtitle">{pageInfo.sub}</div>
            </div>

            {/* Page Content */}
            {activePage === 'dashboard' && (
              <Dashboard
                userName={userName}
                initials={initials}
                summary={summary}
                setSummary={setSummary}
                modules={modules}
                setModules={setModules}
                recommendations={recommendations}
                setRecommendations={setRecommendations}
                scanId={scanId}
                setScanId={setScanId}
                repoUrl={repoUrl}
                setRepoUrl={setRepoUrl}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
                trendData={trendData}
                setTrendData={setTrendData}
                scanHistory={scanHistory}
                setScanHistory={setScanHistory}
                historyKey={historyKey}
                loadFromHistory={loadFromHistory}
                downloadCsv={downloadCsv}
              />
            )}

            {activePage === 'projects' && (
              <ProjectsPage setRepoUrl={setRepoUrl} setActivePage={setActivePage} />
            )}

            {activePage === 'analysis' && (
              <AnalysisPage
                modules={modules}
                summary={summary}
                recommendations={recommendations}
                trendData={trendData}
                onModuleClick={(m) => { setSelectedModule(m); setIsPanelOpen(true); }}
              />
            )}

            {activePage === 'reports' && (
              <ReportsPage
                modules={modules}
                summary={summary}
                recommendations={recommendations}
                scanId={scanId}
                downloadCsv={downloadCsv}
              />
            )}

            {activePage === 'recommendations' && (
              <RecommendationsPage
                recommendations={recommendations}
                modules={modules}
                onModuleClick={(m) => { setSelectedModule(m); setIsPanelOpen(true); }}
              />
            )}

            {activePage === 'trends' && (
              <TrendsPage trendData={trendData} modules={modules} summary={summary} />
            )}

            {activePage === 'graph' && (
              <GraphPage modules={modules} summary={summary} scanId={scanId} />
            )}

            {activePage === 'modules' && (
              <ModulesPage modules={modules} recommendations={recommendations} />
            )}
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
}
