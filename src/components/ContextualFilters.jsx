import React from 'react';

function ContextualFilters({ filters, dimensions, onChange, currentModule }) {
  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  // Filter options based on module
  const getChannelOptions = () => {
    return [
      { value: null, label: 'All Channels' },
      { value: 1, label: 'Call Centre' },
      { value: 2, label: 'Field Sales' },
      { value: 3, label: 'Retail Team' },
    ];
  };

  const getCustomerTypeOptions = () => {
    return [
      { value: null, label: 'All' },
      { value: 1, label: 'Commercial' },
      { value: 2, label: 'Residential' },
    ];
  };

  return (
    <aside className="contextual-filters">
      <div className="filters-title">Filters</div>

      {/* Channel Filter */}
      <div className="filter-section">
        <span className="section-title">Channel</span>
        <div className="filter-options">
          {getChannelOptions().map(option => (
            <label key={option.value} className="filter-option">
              <input
                type="radio"
                name="channel"
                value={option.value || ''}
                checked={filters.channel_id === option.value}
                onChange={() => handleChange('channel_id', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Customer Type Filter */}
      <div className="filter-section">
        <span className="section-title">Customer Type</span>
        <div className="filter-options">
          {getCustomerTypeOptions().map(option => (
            <label key={option.value} className="filter-option">
              <input
                type="radio"
                name="customer-type"
                value={option.value || ''}
                checked={filters.client_type_id === option.value}
                onChange={() => handleChange('client_type_id', option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default ContextualFilters;
