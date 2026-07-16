export default function Navbar({ activeView, setActiveView, onOpenAddTaskModal, openTasks, onLogout, userRole, userName }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'today', label: 'Today' },
    { key: 'all', label: 'Tasks' },
    { key: 'completed', label: 'Done' },
    { key: 'assignees', label: 'Assignee' },
  ];

  return (
    <header className="navbar-header">
      <div className="brand-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h1 className="brand-title">TaskFlow</h1>
        {userRole && (
          <span className="navbar-user-badge">
            {userRole === 'admin' ? 'Admin' : userName}
          </span>
        )}
      </div>

      <nav className="nav-links-row" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-link-btn nav-link-tab ${activeView === item.key ? 'active' : ''}`}
            onClick={() => setActiveView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="nav-actions-row">
        {userRole === 'admin' && (
          <button className="nav-link-btn nav-link-cta" onClick={onOpenAddTaskModal}>
            + New Task
          </button>
        )}
        {onLogout && (
          <button className="nav-link-btn nav-logout-btn" onClick={onLogout} title="Logout" aria-label="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
