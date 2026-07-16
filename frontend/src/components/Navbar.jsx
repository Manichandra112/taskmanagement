import { useEffect } from 'react';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'today',
    label: 'Today',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'all',
    label: 'All Tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    key: 'assignees',
    label: 'Team',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Navbar({ activeView, setActiveView, onOpenAddTaskModal, openTasks, onLogout, userRole, userName }) {
  // Sync URL hash to active view
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const validKeys = NAV_ITEMS.map(i => i.key);
    if (validKeys.includes(hash)) {
      setActiveView(hash);
    }
  }, []);

  const navigate = (key) => {
    setActiveView(key);
    window.location.hash = key;
  };

  // Also react to browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      const validKeys = NAV_ITEMS.map(i => i.key);
      if (validKeys.includes(hash)) {
        setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveView]);

  const initials = userName
    ? userName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (userRole === 'admin' ? 'AD' : '?');

  return (
    <header className="navbar-header" role="banner">
      {/* Brand */}
      <div className="nb-brand">
        <div className="nb-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <span className="nb-brand-name">TaskManagement</span>
      </div>

      {/* Navigation tabs */}
      <nav className="nb-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nb-tab ${activeView === item.key ? 'nb-tab--active' : ''}`}
            onClick={() => navigate(item.key)}
            aria-current={activeView === item.key ? 'page' : undefined}
          >
            <span className="nb-tab-icon">{item.icon}</span>
            <span className="nb-tab-label">{item.label}</span>
            {item.key === 'today'}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="nb-actions">
        {userRole === 'admin' && (
          <button className="nb-cta" onClick={onOpenAddTaskModal} aria-label="Create new task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Task
          </button>
        )}

        {/* User avatar */}
        <div className="nb-user" title={userName || userRole}>
          <div className="nb-avatar">{initials}</div>
          <div className="nb-user-info">
            <span className="nb-user-name">{userName || 'User'}</span>
            <span className="nb-user-role">{userRole}</span>
          </div>
        </div>

        {onLogout && (
          <button className="nb-logout" onClick={onLogout} title="Sign out" aria-label="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
