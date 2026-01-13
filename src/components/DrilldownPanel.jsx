import React from 'react';
import '../styles/DrilldownPanel.css';

function DrilldownPanel({ drilldown, filters, onClose }) {
  if (!drilldown) return null;

  return (
    <div className="drilldown-overlay" onClick={onClose}>
      <div className="drilldown-panel" onClick={e => e.stopPropagation()}>
        <div className="drilldown-header">
          <h2>{drilldown.type.charAt(0).toUpperCase() + drilldown.type.slice(1)} Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drilldown-content">
          <div className="detail-section">
            <h4>Details</h4>
            <dl>
              {Object.entries(drilldown.context || {}).map(([key, value]) => (
                <div key={key} className="detail-row">
                  <dt>{key}</dt>
                  <dd>{typeof value === 'number' ? value.toFixed(2) : value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="detail-section">
            <h4>Filters Applied</h4>
            <dl>
              {Object.entries(filters).filter(([_, v]) => v !== null).map(([key, value]) => (
                <div key={key} className="detail-row">
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DrilldownPanel;
