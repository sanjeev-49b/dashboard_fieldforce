import React, { useState } from 'react';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    organization: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate credentials
    const validOrg = 'DR.ROOF';
    const validUsername = 'admin';
    const validPassword = 'admin pass';

    setTimeout(() => {
      if (
        credentials.organization === validOrg &&
        credentials.username === validUsername &&
        credentials.password === validPassword
      ) {
        // Successful login
        localStorage.setItem('fieldforce_auth', JSON.stringify({
          organization: credentials.organization,
          username: credentials.username,
          loginTime: new Date().toISOString()
        }));
        onLogin(credentials);
      } else {
        setError('Invalid credentials. Please check your organization, username, and password.');
        setIsLoading(false);
      }
    }, 800); // Simulate authentication delay
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">FI</div>
          <h1>Field Intelligence Platform</h1>
          <p className="login-subtitle">Secure Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={credentials.organization}
              onChange={handleChange}
              placeholder="Enter organization name"
              required
              autoComplete="organization"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Field Intelligence Platform</p>
          <p className="security-notice">🔒 Secure Connection</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

