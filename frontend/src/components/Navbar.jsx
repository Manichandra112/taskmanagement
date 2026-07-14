export default function Navbar({ activeView, setActiveView, onOpenAddTaskModal, openTasks }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'today', label: 'Today' },
    { key: 'all', label: 'Tasks' },
    { key: 'completed', label: 'Done' },
    { key: 'assignees', label: 'Team' },
  ];

  return (
    <header className="navbar-header">
      <div className="brand-section">
        <h1 className="brand-title">TaskFlow</h1>
        <div className="brand-pulse">{openTasks}</div>
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
        <button className="nav-link-btn nav-link-cta" onClick={onOpenAddTaskModal}>
          New Task
        </button>
      </div>
    </header>
  );
}
