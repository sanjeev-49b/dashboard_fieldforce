import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import '../styles/FieldSignal.css';

function FieldSignal({ filters, onDrilldown, loading, setLoading }) {
  const [pulse, setPulse] = useState([]);
  const [issues, setIssues] = useState([]);
  const [severityDist, setSeverityDist] = useState([]);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null) params.append(k, v);
    });

    Promise.all([
      axios.get(`/api/field-signal/pulse?${params}`),
      axios.get(`/api/field-signal/issues?${params}`),
      axios.get(`/api/field-signal/severity-distribution?${params}`),
      axios.get(`/api/field-signal/hotspots?${params}`),
    ])
      .then(([pulseRes, issuesRes, severityRes, hotspotsRes]) => {
        setPulse(pulseRes.data.data);
        setIssues(issuesRes.data.data);
        setSeverityDist(severityRes.data.data);
        setHotspots(hotspotsRes.data.data);
      })
      .catch(err => console.error('Error loading Field Signal:', err))
      .finally(() => setLoading(false));
  }, [filters, setLoading]);

  // Pulse chart data
  const pulseData = [
    {
      x: pulse.map(p => p.calendar_date),
      y: pulse.map(p => p.conversation_count),
      name: 'Conversations',
      type: 'scatter',
      mode: 'lines+markers',
      yaxis: 'y1',
      line: { color: '#1C3F7C', width: 3 },
    },
    {
      x: pulse.map(p => p.calendar_date),
      y: pulse.map(p => p.avg_sentiment),
      name: 'Sentiment',
      type: 'scatter',
      mode: 'lines',
      yaxis: 'y2',
      line: { color: '#2ECC71', width: 2 },
    },
  ];

  const pulseLayout = {
    title: 'Daily Conversation Pulse',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Conversations' },
    yaxis2: { title: 'Sentiment', overlaying: 'y', side: 'right' },
    hovermode: 'x unified',
    plot_bgcolor: '#F2F4F7',
    paper_bgcolor: 'white',
    margin: { t: 50, r: 60 },
  };

  const pulseConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'daily_pulse',
      height: 500,
      width: 800,
    }
  };

  // Issues chart data
  const issuesData = [{
    x: issues.map(i => i.volume),
    y: issues.map(i => i.issue_name),
    type: 'bar',
    orientation: 'h',
    marker: { color: '#E74C3C' },
  }];

  const issuesLayout = {
    title: 'Top Issues by Volume',
    xaxis: { title: 'Conversations' },
    plot_bgcolor: '#F2F4F7',
    paper_bgcolor: 'white',
    margin: { l: 200, t: 50 },
  };

  const issuesConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
    displaylogo: false,
  };

  // Severity distribution
  const severityData = [{
    labels: severityDist.map(s => s.severity),
    values: severityDist.map(s => s.count),
    type: 'pie',
    marker: {
      colors: ['#E74C3C', '#E67E22', '#2ECC71'],
    },
  }];

  const severityLayout = {
    title: 'Severity Distribution',
    paper_bgcolor: 'white',
  };

  const severityConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines', 'zoom2d'],
    displaylogo: false,
  };

  return (
    <div className="field-signal">
      <div className="module-header">
        <h2>Field Signal</h2>
        <p>Real-time pulse, spikes, and hotspots</p>
      </div>

      <div className="charts-grid">
        {/* Pulse */}
        <div className="chart-card">
          <Plot data={pulseData} layout={pulseLayout} config={pulseConfig} />
        </div>

        {/* Issues */}
        <div className="chart-card">
          <Plot data={issuesData} layout={issuesLayout} config={issuesConfig} />
        </div>

        {/* Severity */}
        <div className="chart-card">
          <Plot data={severityData} layout={severityLayout} config={severityConfig} />
        </div>
      </div>

      {/* Issues Table */}
      <div className="table-card">
        <h3>All Issues</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Volume</th>
              <th>Sentiment</th>
              <th>Severity</th>
              <th>Conversions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.issue_id} onClick={() => onDrilldown('issue', issue.issue_id, issue)}>
                <td><strong>{issue.issue_name}</strong></td>
                <td>{issue.volume}</td>
                <td>{issue.avg_sentiment?.toFixed(2)}</td>
                <td>
                  <span className={`severity-badge ${issue.severity_score > 2.5 ? 'high' : 'medium'}`}>
                    {issue.severity_score?.toFixed(1)}
                  </span>
                </td>
                <td>{issue.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hotspots Table */}
      <div className="table-card">
        <h3>Regional Hotspots</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Region</th>
              <th>Conversations</th>
              <th>Avg Risk</th>
            </tr>
          </thead>
          <tbody>
            {hotspots.map(hotspot => (
              <tr key={hotspot.region_id}>
                <td><strong>{hotspot.region_name}</strong></td>
                <td>{hotspot.conversation_count}</td>
                <td>
                  <span className={`risk-badge ${hotspot.avg_risk > 60 ? 'high' : 'medium'}`}>
                    {hotspot.avg_risk?.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FieldSignal;
