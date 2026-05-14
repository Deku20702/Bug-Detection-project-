import React, { useState } from 'react';
import ModuleTable from '../components/dashboard/ModuleTable';
import SidePanel from '../components/dashboard/SidePanel';

const ModulesPage = ({ modules, recommendations }) => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (!modules.length) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <div className="scan-radar"><span style={{ fontSize: '24px' }}>📦</span></div>
          <h3>No Modules Found</h3>
          <p>Run a scan from the Dashboard to see module details here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        moduleData={selectedModule}
        recommendation={recommendations.find(r => r.module === selectedModule?.module)}
        context="module"
      />
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Modules ({modules.length})</span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Click any row for details</span>
        </div>
        <ModuleTable
          modules={modules}
          onRowClick={m => { setSelectedModule(m); setIsPanelOpen(true); }}
        />
      </div>
    </div>
  );
};

export default ModulesPage;
