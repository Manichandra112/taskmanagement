import { useEffect, useState } from 'react';

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.7 13.7 0 0 1-3.2 4.2" />
      <path d="M6.6 6.7C3.8 8.5 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.1-.9" />
    </svg>
  );
}

export default function Login({ onLoginSuccess, onNotify }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [allowManualEntry, setAllowManualEntry] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
  }, []);

  const enableManualEntry = () => {
    if (!allowManualEntry) {
      setAllowManualEntry(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.user);
        onNotify?.({ type: 'success', title: 'Login Successful', message: `Welcome back, ${data.user.name}.` });
      } else {
        const message = data.error || 'Authentication failed. Please check your credentials.';
        setError(message);
        onNotify?.({ type: 'warning', title: 'Login Failed', message });
      }
    } catch (err) {
      console.error('Error logging in:', err);
      const message = 'Cannot connect to the authorization server. Verify the backend is active on port 5000.';
      setError(message);
      onNotify?.({ type: 'warning', title: 'Connection Error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-backdrop-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
      </div>

      <div className="login-card-glass">
        <div className="login-brand">
          <div className="brand-logo-glow ghl-brand-mark">GHL</div>
          <h2>Task Management</h2>
        </div>

        {error && (
          <div className="login-error-alert animate-shake">
            <span className="error-icon">!</span>
            <span className="error-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <div className="login-form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <span className="input-icon"><EmailIcon /></span>
              <input
                id="email"
                name="login-email"
                type="email"
                autoComplete="off"
                readOnly={!allowManualEntry}
                onFocus={enableManualEntry}
                onMouseDown={enableManualEntry}
                required
                disabled={isLoading}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon input-with-action">
              <span className="input-icon"><LockIcon /></span>
              <input
                id="password"
                name="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                readOnly={!allowManualEntry}
                onFocus={enableManualEntry}
                onMouseDown={enableManualEntry}
                required
                disabled={isLoading}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`login-submit-btn ${isLoading ? 'btn-loading' : ''}`}
          >
            {isLoading ? <span className="btn-spinner"></span> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
