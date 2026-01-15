import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

function Home({ filters, loading, setLoading }) {
  const [tiles, setTiles] = useState([]);
  const [pulse, setPulse] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedCharts, setSelectedCharts] = useState([
    'pulse',
    'top-issues',
    'severity'
  ]);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const availableCharts = [
    { id: 'pulse', name: 'Daily Conversation Pulse', module: 'Signal', icon: '📈' },
    { id: 'top-issues', name: 'Top Issues by Volume', module: 'Signal', icon: '🔥' },
    { id: 'severity', name: 'Severity Distribution', module: 'Signal', icon: '⚠️' },
    { id: 'agents', name: 'Agent Performance', module: 'Operations', icon: '👥' },
    { id: 'teams', name: 'Team Performance', module: 'Operations', icon: '👔' },
    { id: 'outcomes', name: 'Outcome Distribution', module: 'Strategy', icon: '🎯' },
    { id: 'risk-region', name: 'Risk by Region', module: 'Strategy', icon: '🗺️' },
    { id: 'entities', name: 'Entity Demand', module: 'Intel', icon: '🏷️' },
    { id: 'competitors', name: 'Competitor Analysis', module: 'Intel', icon: '🎪' },
  ];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params.append(k, v);
    });

    Promise.all([
      axios.get(`/api/mission-brief/tiles?${params}`),
      axios.get(`/api/field-signal/pulse?${params}`),
      axios.get(`/api/field-signal/issues?${params}`),
    ])
      .then(([tilesRes, pulseRes, issuesRes]) => {
        setTiles(tilesRes.data.tiles || []);
        setPulse(pulseRes.data.data || []);
        setIssues(issuesRes.data.data || []);
      })
      .catch(err => console.error('Error loading Home:', err))
      .finally(() => setLoading(false));
  }, [filters, setLoading]);

  const toggleChartSelection = (chartId) => {
    if (selectedCharts.includes(chartId)) {
      setSelectedCharts(prev => prev.filter(id => id !== chartId));
    } else {
      if (selectedCharts.length >= 5) {
        alert('Maximum 5 charts allowed');
        return;
      }
      setSelectedCharts(prev => [...prev, chartId]);
    }
  };

  const renderChart = (chartId) => {
    switch (chartId) {
      case 'pulse':
        return renderPulseChart();
      case 'top-issues':
        return renderTopIssuesChart();
      case 'severity':
        return renderSeverityChart();
      default:
        return null;
    }
  };

  const renderPulseChart = () => {
    if (pulse.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</div>;

    return (
      <Plot
        data={[
          {
            x: pulse.map(p => p.calendar_date),
            y: pulse.map(p => p.conversation_count),
            name: 'Conversations',
            type: 'scatter',
            mode: 'lines+markers',
            yaxis: 'y1',
            line: { color: '#0074D9', width: 3 },
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
        ]}
        layout={{
          title: {
            text: 'Daily Conversation Pulse',
            y: 0.98,
            yanchor: 'top'
          },
          xaxis: { title: 'Date' },
          yaxis: { title: 'Conversations' },
          yaxis2: { title: 'Sentiment', overlaying: 'y', side: 'right' },
          hovermode: 'x unified',
          plot_bgcolor: '#F5F7FA',
          paper_bgcolor: '#FFFFFF',
          margin: { t: 60, r: 80, b: 50, l: 60 },
          height: 360,
        }}
        config={{ 
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
          displaylogo: false,
        }}
        style={{ width: '100%', height: '320px' }}
      />
    );
  };

  const renderTopIssuesChart = () => {
    if (issues.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</div>;

    return (
      <Plot
        data={[{
          x: issues.slice(0, 8).map(i => i.volume),
          y: issues.slice(0, 8).map(i => i.issue_name),
          type: 'bar',
          orientation: 'h',
          marker: { color: '#E74C3C' },
        }]}
        layout={{
          title: {
            text: 'Top Issues by Volume',
            y: 0.98,
            yanchor: 'top'
          },
          xaxis: { title: 'Conversations' },
          plot_bgcolor: '#F5F7FA',
          paper_bgcolor: '#FFFFFF',
          margin: { t: 60, r: 20, b: 50, l: 150 },
          height: 360,
        }}
        config={{ 
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
          displaylogo: false,
        }}
        style={{ width: '100%', height: '320px' }}
      />
    );
  };

  const renderSeverityChart = () => {
    const severityMap = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    issues.forEach(issue => {
      if ((issue.severity_score || 0) > 2.5) severityMap.HIGH++;
      else if ((issue.severity_score || 0) > 1.5) severityMap.MEDIUM++;
      else severityMap.LOW++;
    });

    return (
      <Plot
        data={[{
          labels: ['High', 'Medium', 'Low'],
          values: [severityMap.HIGH, severityMap.MEDIUM, severityMap.LOW],
          type: 'pie',
          marker: { colors: ['#E74C3C', '#E67E22', '#2ECC71'] }
        }]}
        layout={{
          title: {
            text: 'Severity Distribution',
            y: 0.98,
            yanchor: 'top'
          },
          paper_bgcolor: '#FFFFFF',
          height: 360,
          margin: { t: 60, r: 20, b: 40, l: 20 },
        }}
        config={{ 
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines', 'zoom2d'],
          displaylogo: false,
        }}
        style={{ width: '100%', height: '320px' }}
      />
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="module-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Home</h2>
            <p>Your personalized intelligence dashboard. Select up to 5 key visualizations.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowConfigModal(true)}>
            ⚙️ Configure Charts
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {tiles.map(tile => (
          <div key={tile.id} className="metric-card">
            <span className="metric-label">{tile.label}</span>
            <div className={`metric-value ${tile.type === 'percent' ? 'success' : tile.type === 'decimal' ? 'secondary' : ''}`}>
              {tile.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedCharts.length <= 2 ? 'repeat(auto-fit, minmax(500px, 1fr))' : 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {selectedCharts.map(chartId => (
          <div key={chartId} className="card">
            <div className="card-body" style={{ minHeight: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {renderChart(chartId)}
            </div>
          </div>
        ))}
      </div>

      {/* Configure Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Configure Dashboard Charts</span>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Select up to 5 charts to display on your dashboard. Currently using {selectedCharts.length}/5.
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                {availableCharts.map(chart => (
                  <label key={chart.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#F5F7FA',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid transparent'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedCharts.includes(chart.id)}
                      onChange={() => toggleChartSelection(chart.id)}
                      disabled={!selectedCharts.includes(chart.id) && selectedCharts.length >= 5}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '18px' }}>{chart.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{chart.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{chart.module}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
