import React from 'react';

export default function Navbar({ activeView, setActiveView, onOpenAddTaskModal }) {
  const handleLogout = () => {
    alert("Logout button clicked (Mock).");
  };

  return (
    <header className="navbar-header">
      <div className="brand-section">
        <h1 className="brand-title">Task</h1>
      </div>

      <nav className="nav-links-row">
        <button 
          className={`nav-link-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-link-btn ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => setActiveView('today')}
        >
          Today Tasks
        </button>
        <button 
          className={`nav-link-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          All Tasks
        </button>
        <button 
          className={`nav-link-btn ${activeView === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveView('completed')}
        >
          Completed Tasks
        </button>
        <button 
          className="nav-link-btn"
          onClick={onOpenAddTaskModal}
        >
          Add Task
        </button>
        <button 
          className={`nav-link-btn ${activeView === 'assignees' ? 'active' : ''}`}
          onClick={() => setActiveView('assignees')}
        >
          Assignee
        </button>
        <button 
          className="nav-link-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
        
        {/* API Transporter secondary option */}
        <button 
          className={`nav-link-btn ${activeView === 'api-converter' ? 'active' : ''}`}
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1.5px solid var(--border-color)' }}
          onClick={() => setActiveView('api-converter')}
          title="API Transporter"
        >
          🔌 API
        </button>

        {/* Profile / Menu Grid icon on the far right */}
        <div className="profile-icon" title="Menu Options">
          ✥
        </div>
      </nav>
    </header>
  );
}
