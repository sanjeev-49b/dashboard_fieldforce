import React from 'react';
import '../styles/GlobalFilters.css';

function GlobalFilters({ filters, dimensions, onChange }) {
  const timeRanges = dimensions?.time_ranges || [];
  const regions = dimensions?.regions || [];
  const teams = dimensions?.teams || [];

  return (
    <div className="global-filters">
      <div className="filter-group">
        <label>Time Range</label>
        <select
          value={filters.time_range}
          onChange={(e) => onChange({ time_range: e.target.value })}
          className="filter-select"
        >
          {timeRanges.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Region</label>
        <select
          value={filters.region_id || ''}
          onChange={(e) => onChange({ region_id: e.target.value || null })}
          className="filter-select"
        >
          <option value="">All Regions</option>
          {regions.map(region => (
            <option key={region.region_id} value={region.region_id}>
              {region.region_name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Team</label>
        <select
          value={filters.team_id || ''}
          onChange={(e) => onChange({ team_id: e.target.value || null })}
          className="filter-select"
        >
          <option value="">All Teams</option>
          {teams.map(team => (
            <option key={team.team_id} value={team.team_id}>
              {team.team_name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-badge">
        {Object.values(filters).filter(v => v).length} filter{Object.values(filters).filter(v => v).length !== 1 ? 's' : ''} applied
      </div>
    </div>
  );
}

export default GlobalFilters;
