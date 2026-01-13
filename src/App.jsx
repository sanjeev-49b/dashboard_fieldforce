import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import GlobalFilters from './components/GlobalFilters';
import ContextualFilters from './components/ContextualFilters';
import Home from './pages/Home';
import FieldSignal from './pages/FieldSignal';
import FieldIntel from './pages/FieldIntel';
import FieldOps from './pages/FieldOps';
import FieldStrategy from './pages/FieldStrategy';
import FieldHQ from './pages/FieldHQ';
import DrilldownPanel from './components/DrilldownPanel';

export const FilterContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('home');
  const [filters, setFilters] = useState({
    time_range: '7',
    region_id: null,
    team_id: null,
    channel_id: null,
    client_type_id: null,
  });
  const [filterDimensions, setFilterDimensions] = useState(null);
  const [drilldown, setDrilldown] = useState(null);
  const [loading, setLoading] = useState(false);

  const modules = [
    { id: 'home', label: 'Home' },
    { id: 'field-signal', label: 'Signal' },
    { id: 'field-intel', label: 'Intel' },
    { id: 'field-ops', label: 'Operations' },
    { id: 'field-strategy', label: 'Strategy' },
    { id: 'field-hq', label: 'Admin HQ' },
  ];

  // Check authentication on mount
  useEffect(() => {
    const authData = localStorage.getItem('fieldforce_auth');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        setUser(parsedAuth);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Invalid auth data:', err);
        localStorage.removeItem('fieldforce_auth');
      }
    }
  }, []);

  // Load filter dimensions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      axios.get('/api/filters/dimensions')
        .then(res => setFilterDimensions(res.data))
        .catch(err => console.error('Error loading filters:', err));
    }
  }, [isAuthenticated]);

  const handleLogin = (credentials) => {
    setUser({
      organization: credentials.organization,
      username: credentials.username
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fieldforce_auth');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentModule('home');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDrilldown = (type, id, context) => {
    setDrilldown({ type, id, context });
  };

  const closeDrilldown = () => {
    setDrilldown(null);
  };

  const renderModule = () => {
    const moduleProps = {
      filters,
      onDrilldown: handleDrilldown,
      loading,
      setLoading,
    };

    switch (currentModule) {
      case 'home':
        return <Home {...moduleProps} />;
      case 'field-signal':
        return <FieldSignal {...moduleProps} />;
      case 'field-intel':
        return <FieldIntel {...moduleProps} />;
      case 'field-ops':
        return <FieldOps {...moduleProps} />;
      case 'field-strategy':
        return <FieldStrategy {...moduleProps} />;
      case 'field-hq':
        return <FieldHQ {...moduleProps} />;
      default:
        return <Home {...moduleProps} />;
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters: handleFilterChange }}>
      <div className="app">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-left">
            <div className="app-logo">FI</div>
            <div className="app-title">Field Intelligence</div>
          </div>

          {/* CENTER NAVIGATION */}
          <nav className="header-nav">
            {modules.map(module => (
              <button
                key={module.id}
                className={`nav-link ${currentModule === module.id ? 'active' : ''}`}
                onClick={() => setCurrentModule(module.id)}
              >
                {module.label}
              </button>
            ))}
          </nav>

          {/* RIGHT - Status & User */}
          <div className="header-right">
            <span className="status-badge">● Live</span>
            <div className="user-menu" onClick={handleLogout} title="Click to logout">
              <div className="user-avatar">{user?.organization?.substring(0, 2) || 'DR'}</div>
              <span>{user?.username || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Global Filters Bar */}
        {filterDimensions && (
          <GlobalFilters 
            filters={filters} 
            dimensions={filterDimensions}
            onChange={handleFilterChange} 
          />
        )}

        <div className="main-container">
          {/* Contextual Filters Sidebar */}
          {filterDimensions && (
            <ContextualFilters
              filters={filters}
              dimensions={filterDimensions}
              onChange={handleFilterChange}
              currentModule={currentModule}
            />
          )}

          {/* Main Content */}
          <main className="main-content">
            {renderModule()}
          </main>

          {/* Drilldown Panel */}
          {drilldown && (
            <DrilldownPanel 
              drilldown={drilldown}
              filters={filters}
              onClose={closeDrilldown}
            />
          )}
        </div>
      </div>
    </FilterContext.Provider>
  );
}

export default App;
