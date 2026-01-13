import React, { useState } from 'react';

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo">FI</div>
        <div>
          <div className="app-title">Field Intelligence</div>
          <div className="app-subtitle">Conversation Analytics Platform</div>
        </div>
      </div>

      <div className="header-right">
        <span className="status-badge online">● Live</span>
        
        <div style={{ position: 'relative' }}>
          <div 
            className="user-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">AC</div>
            <span>Admin</span>
          </div>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #D9E2EC',
              borderRadius: '8px',
              minWidth: '160px',
              boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
              zIndex: 1000,
              marginTop: '8px'
            }}>
              <div style={{ padding: '8px 0' }}>
                <a href="#" style={{
                  display: 'block',
                  padding: '8px 16px',
                  color: '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }} onMouseEnter={e => e.target.style.background = '#F2F4F7'} onMouseLeave={e => e.target.style.background = ''}>
                  👤 Profile
                </a>
                <a href="#" style={{
                  display: 'block',
                  padding: '8px 16px',
                  color: '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }} onMouseEnter={e => e.target.style.background = '#F2F4F7'} onMouseLeave={e => e.target.style.background = ''}>
                  ⚙️ Settings
                </a>
                <a href="#" style={{
                  display: 'block',
                  padding: '8px 16px',
                  color: '#1A1A1A',
                  textDecoration: 'none',
                  fontSize: '14px',
                  borderTop: '1px solid #D9E2EC',
                  transition: 'all 0.2s'
                }} onMouseEnter={e => e.target.style.background = '#F2F4F7'} onMouseLeave={e => e.target.style.background = ''}>
                  🚪 Logout
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
