import React from 'react';

function Navigation({ currentModule, onModuleChange }) {
  const modules = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'field-signal', label: 'Signal', icon: '📡' },
    { id: 'field-intel', label: 'Intel', icon: '💡' },
    { id: 'field-ops', label: 'Operations', icon: '👥' },
    { id: 'field-strategy', label: 'Strategy', icon: '♟️' },
    { id: 'field-hq', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-content">
        {modules.map(module => (
          <button
            key={module.id}
            className={`nav-button ${currentModule === module.id ? 'active' : ''}`}
            onClick={() => onModuleChange(module.id)}
            title={module.label}
          >
            <span className="nav-icon">{module.icon}</span>
            <span>{module.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;
