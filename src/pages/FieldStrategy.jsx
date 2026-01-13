import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

function FieldStrategy({ filters, loading, setLoading }) {
  const [outcomes, setOutcomes] = useState([]);
  const [riskByRegion, setRiskByRegion] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [pulse, setPulse] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null) params.append(k, v);
    });

    Promise.all([
      axios.get(`/api/mission-brief/tiles?${params}`),
      axios.get(`/api/field-strategy/outcomes?${params}`),
      axios.get(`/api/field-strategy/risk-by-region?${params}`),
      axios.get(`/api/field-signal/pulse?${params}`),
      axios.get(`/api/field-signal/issues?${params}`),
    ])
      .then(([tilesRes, outcomesRes, riskRes, pulseRes, issuesRes]) => {
        setTiles(tilesRes.data.tiles || []);
        setOutcomes(outcomesRes.data.data || []);
        setRiskByRegion(riskRes.data.data || []);
        setPulse(pulseRes.data.data || []);
        setIssues(issuesRes.data.data || []);
      })
      .catch(err => console.error('Error loading Strategy:', err))
      .finally(() => setLoading(false));
  }, [filters, setLoading]);

  // Safe null checks
  const convTile = tiles.find(t => t.id === 'conv_rate');
  const convRate = convTile ? parseFloat(convTile.value) : 0;
  const totalConvs = tiles.find(t => t.id === 'conversations')?.value || 0;

  const avgRisk = riskByRegion.length > 0 
    ? (riskByRegion.reduce((sum, r) => sum + (r.avg_risk || 0), 0) / riskByRegion.length).toFixed(1)
    : 0;

  const criticalIssues = issues.filter(i => (i.severity_score || 0) > 2.5).length;

  return (
    <div>
      {/* Header */}
      <div className="module-header">
        <h2>Field Strategy</h2>
        <p>Business Unit Head Insights (CXO View)</p>
      </div>

      {/* Data Status Banner */}
      <div style={{
        background: '#E3F2FD',
        border: '1px solid #2196F3',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <div>
            <strong>Current Data</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              Based on {totalConvs} conversations across {riskByRegion.length} regions. 
              With more data, you can unlock predictive analytics, funnel analysis, and causal mapping.
            </p>
          </div>
        </div>
      </div>

      {/* Core KPI Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="metric-card">
          <span className="metric-label">🎯 Conversion Rate</span>
          <div className="metric-value success">{convRate}%</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ {tiles.find(t => t.id === 'conversions')?.value || 0} of {totalConvs}
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">⚠️ Avg Territory Risk</span>
          <div className="metric-value risk">{avgRisk}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Across {riskByRegion.length} regions
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">🔥 Critical Issues</span>
          <div className="metric-value">{criticalIssues}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Severity > 2.5
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">📊 Avg Sentiment</span>
          <div className="metric-value secondary">
            {(tiles.find(t => t.id === 'sentiment')?.value || '0.00')}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Across all convs
          </div>
        </div>
      </div>

      {/* ACTUAL DATA SECTION */}
      <div style={{
        background: '#F0F7F0',
        border: '2px solid #2ECC71',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#27AE60', fontSize: '16px', fontWeight: 700 }}>
          ✓ ACTUAL DATA - Ready Now
        </h3>

        {/* Territory Risk Map */}
        {riskByRegion.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <Plot
                data={[{
                  x: riskByRegion.map(r => r.region_name || 'Unknown'),
                  y: riskByRegion.map(r => r.avg_risk || 0),
                  type: 'bar',
                  marker: {
                    color: riskByRegion.map(r => r.avg_risk || 0),
                    colorscale: 'Reds'
                  }
                }]}
                layout={{
                  title: '✓ Territory Risk Map (Actual Data)',
                  xaxis: { title: 'Region' },
                  yaxis: { title: 'Risk Score' },
                  plot_bgcolor: '#F5F7FA',
                  paper_bgcolor: '#FFFFFF',
                  height: 350,
                }}
                config={{ responsive: true }}
              />
            </div>
          </div>
        )}

        {/* Top Issues by Impact */}
        {issues.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <Plot
                data={[{
                  x: issues.slice(0, 5).map(i => i.volume || 0),
                  y: issues.slice(0, 5).map(i => i.issue_name || 'Unknown'),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#E74C3C' }
                }]}
                layout={{
                  title: '✓ Top Issues by Volume (Actual Data)',
                  xaxis: { title: 'Conversation Count' },
                  plot_bgcolor: '#F5F7FA',
                  paper_bgcolor: '#FFFFFF',
                  margin: { l: 150 },
                  height: 300,
                }}
                config={{ responsive: true }}
              />
            </div>
          </div>
        )}

        {/* Actual Data Table */}
        <div className="card">
          <div className="card-header">
            <span>✓ Regional Risk Details (Actual)</span>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Conversations</th>
                  <th>Avg Risk</th>
                  <th>Sentiment</th>
                  <th>High Severity Issues</th>
                </tr>
              </thead>
              <tbody>
                {riskByRegion.length > 0 ? (
                  riskByRegion.map(region => (
                    <tr key={region.region_id}>
                      <td><strong>{region.region_name || 'Unknown'}</strong></td>
                      <td>{region.conversation_count || 0}</td>
                      <td>
                        <span className={`badge ${(region.avg_risk || 0) > 70 ? 'risk' : (region.avg_risk || 0) > 50 ? 'warning' : 'success'}`}>
                          {(region.avg_risk || 0).toFixed(1)}
                        </span>
                      </td>
                      <td>{(region.avg_sentiment || 0).toFixed(2)}</td>
                      <td>
                        {issues.filter(i => (i.severity_score || 0) > 2.5).length}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FUTURE INSIGHTS SECTION - With Mock Data */}
      <div style={{
        background: '#F5E6FF',
        border: '2px solid #9B59B6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#8E44AD', fontSize: '16px', fontWeight: 700 }}>
          🚀 PREDICTIVE INSIGHTS - Unlocks with More Data
        </h3>

        {/* Mock Predictive Risk Trend */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                x: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
                y: [52, 54, 51, 58, 62, 65, 68],
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#E74C3C', width: 3 },
                fill: 'tozeroy',
                fillcolor: 'rgba(231, 76, 60, 0.2)',
                name: 'Actual'
              }, {
                x: ['Day 7', 'Day 8', 'Day 9', 'Day 10'],
                y: [68, 72, 75, 79],
                type: 'scatter',
                mode: 'lines+markers+text',
                line: { color: '#E67E22', width: 3, dash: 'dash' },
                name: 'Forecast (with ML)',
                text: ['', '', '', '↗ Trend'],
                textposition: 'top center'
              }]}
              layout={{
                title: '🚀 Predictive Risk Trend (Mock - Requires Historical Data)',
                xaxis: { title: 'Date' },
                yaxis: { title: 'Risk Score (0-100)' },
                plot_bgcolor: '#F5F7FA',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'x unified',
                height: 350,
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>

        {/* Mock Outcome Funnel */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                type: 'funnel',
                y: ['Initial Contact', 'Engagement', 'Problem Identified', 'Solution Offered', 'Converted'],
                x: [100, 85, 72, 60, 45],
                marker: { color: ['#3498DB', '#2ECC71', '#E67E22', '#E74C3C', '#9B59B6'] }
              }]}
              layout={{
                title: '🚀 Outcome Conversion Funnel (Mock - Requires Outcome Mapping)',
                paper_bgcolor: '#FFFFFF',
                height: 350,
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>

        {/* What's Needed Card */}
        <div style={{
          background: 'white',
          border: '1px solid #E0E6ED',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <h4 style={{ marginBottom: '12px', color: '#8E44AD' }}>📋 To Unlock These Insights:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
            <li>30+ days of conversation history for trend analysis</li>
            <li>Outcome stages mapped to conversations (initial → resolved)</li>
            <li>Historical risk scores to build predictive models</li>
            <li>Customer/deal mapping for funnel analysis</li>
            <li>Attribution data (which issue → which outcome)</li>
          </ul>
        </div>
      </div>


    </div>
  );
}

export default FieldStrategy;
