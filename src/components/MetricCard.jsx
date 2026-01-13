import React from 'react';

function MetricCard({ label, value, type = 'number', change = null, icon = null }) {
  const getValueClass = () => {
    switch (type) {
      case 'percent': return 'metric-value success';
      case 'risk': return 'metric-value risk';
      case 'decimal': return 'metric-value secondary';
      default: return 'metric-value';
    }
  };

  return (
    <div className="metric-card">
      {icon && <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>}
      <span className="metric-label">{label}</span>
      <div className={getValueClass()}>{value}</div>
      {change && (
        <div className={`metric-change ${change.positive ? 'positive' : 'negative'}`}>
          {change.positive ? '↑' : '↓'} {change.text}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
