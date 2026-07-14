import React from 'react';

export default function Sidebar({ activeView, setActiveView, tasks }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Complete').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo">G</div>
        <div>
          <span className="brand-title">GHL Ventures</span>
          <span className="brand-subtitle">Task Center</span>
        </div>
      </div>

      <nav className="nav-menu">
        <li 
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </li>
        <li 
          className={`nav-item ${activeView === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveView('tasks')}
        >
          <span className="nav-icon">📋</span>
          <span>Task Board</span>
        </li>
        <li 
          className={`nav-item ${activeView === 'api-converter' ? 'active' : ''}`}
          onClick={() => setActiveView('api-converter')}
        >
          <span className="nav-icon">⚡</span>
          <span>API Transporter</span>
        </li>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-stats">
          <div className="sidebar-stats-row">
            <span className="sidebar-stats-label">Total Workload</span>
            <span className="sidebar-stats-val">{totalTasks}</span>
          </div>
          <div className="sidebar-stats-row">
            <span className="sidebar-stats-label">Completed</span>
            <span className="sidebar-stats-val">{completedTasks}</span>
          </div>
          <div className="sidebar-stats-row">
            <span className="sidebar-stats-label">Pending</span>
            <span className="sidebar-stats-val" style={{ color: 'var(--color-pending)' }}>{pendingTasks}</span>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            {completionPercentage}% Done
          </div>
        </div>
      </div>
    </aside>
  );
}
