import React, { useState, useMemo, useEffect } from 'react';

function riskLevel(r) {
  if (r >= 0.7) return "high";
  if (r >= 0.4) return "mid";
  return "low";
}

const ModuleTable = ({ modules, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'risk', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [modules]);

  const sortedModules = useMemo(() => {
    let items = [...modules];
    items.sort((a, b) => {
      let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      if (['in_degree', 'out_degree', 'cycle_count'].includes(sortConfig.key)) {
        aVal = a.features?.[sortConfig.key] || 0;
        bVal = b.features?.[sortConfig.key] || 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [modules, sortConfig]);

  const displayed = useMemo(() => {
    if (rowsPerPage === 'All') return sortedModules;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedModules.slice(start, start + rowsPerPage);
  }, [sortedModules, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === 'All' ? 1 : Math.ceil(sortedModules.length / rowsPerPage);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <span style={{ opacity: 0.3 }}> ↕</span>;
    return sortConfig.direction === 'asc' ? <span> ↑</span> : <span> ↓</span>;
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table className="mod-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('module')}>Module{getSortIcon('module')}</th>
              <th onClick={() => requestSort('risk')}>Risk{getSortIcon('risk')}</th>
              <th style={{ textAlign: 'right' }} onClick={() => requestSort('in_degree')}>In{getSortIcon('in_degree')}</th>
              <th style={{ textAlign: 'right' }} onClick={() => requestSort('out_degree')}>Out{getSortIcon('out_degree')}</th>
              <th style={{ textAlign: 'right' }} onClick={() => requestSort('cycle_count')}>Cycles{getSortIcon('cycle_count')}</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(m => {
              const pct = Math.round((m.risk || 0) * 100);
              const lvl = riskLevel(m.risk || 0);
              return (
                <tr key={m.module} onClick={() => onRowClick(m)} style={{ cursor: 'pointer' }}>
                  <td><span className="mod-name">{m.module}</span></td>
                  <td><span className={`risk-chip risk-${lvl}`}>{pct}%</span></td>
                  <td style={{ textAlign: 'right' }}>{m.features?.in_degree || 0}</td>
                  <td style={{ textAlign: 'right' }}>{m.features?.out_degree || 0}</td>
                  <td style={{ textAlign: 'right' }}>{m.features?.cycle_count || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedModules.length > 0 && (
        <div className="pagination">
          <span>
            Showing {rowsPerPage === 'All' ? sortedModules.length : Math.min(sortedModules.length, (currentPage - 1) * (rowsPerPage || 0) + 1)}–{rowsPerPage === 'All' ? sortedModules.length : Math.min(sortedModules.length, currentPage * rowsPerPage)} of {sortedModules.length}
          </span>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span>
              Rows:&nbsp;
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value="All">All</option>
              </select>
            </span>
            {rowsPerPage !== 'All' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                <span style={{ padding: '5px 8px', fontSize: '12px' }}>{currentPage}/{totalPages}</span>
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleTable;
