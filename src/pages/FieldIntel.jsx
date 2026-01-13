import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

function FieldIntel({ filters, loading, setLoading }) {
  const [tiles, setTiles] = useState([]);
  const [issues, setIssues] = useState([]);
  const [riskByRegion, setRiskByRegion] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null) params.append(k, v);
    });

    Promise.all([
      axios.get(`/api/mission-brief/tiles?${params}`),
      axios.get(`/api/field-signal/issues?${params}`),
      axios.get(`/api/field-strategy/risk-by-region?${params}`),
    ])
      .then(([tilesRes, issuesRes, riskRes]) => {
        setTiles(tilesRes.data.tiles || []);
        setIssues(issuesRes.data.data || []);
        setRiskByRegion(riskRes.data.data || []);
      })
      .catch(err => console.error('Error loading Intel:', err))
      .finally(() => setLoading(false));
  }, [filters, setLoading]);

  const totalConvs = tiles.find(t => t.id === 'conversations')?.value || 0;
  const avgSentiment = parseFloat(tiles.find(t => t.id === 'sentiment')?.value || 0);

  return (
    <div>
      {/* Header */}
      <div className="module-header">
        <h2>Field Intel</h2>
        <p>Entity & Competitor Intelligence</p>
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
            <strong>Field Intelligence</strong>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              Analyze entities and competitors mentioned in conversations. 
              With more data, unlock demand forecasting and sentiment analysis by entity type.
            </p>
          </div>
        </div>
      </div>

      {/* Core KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="metric-card">
          <span className="metric-label">📊 Total Conversations</span>
          <div className="metric-value">{totalConvs}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Analyzed for entities
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">🏷️ Unique Issues</span>
          <div className="metric-value">{issues.length}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Extracted entities
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">😊 Avg Sentiment</span>
          <div className="metric-value secondary">{avgSentiment.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Entity-level analysis
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">🗺️ Regions Covered</span>
          <div className="metric-value">{riskByRegion.length}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Regional distribution
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

        {/* Top Issues/Entities */}
        {issues.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <Plot
                data={[{
                  x: issues.slice(0, 8).map(i => i.volume || 0),
                  y: issues.slice(0, 8).map(i => i.issue_name || 'Unknown'),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#0074D9' }
                }]}
                layout={{
                  title: '✓ Top Issues/Entities by Frequency',
                  xaxis: { title: 'Mention Count' },
                  plot_bgcolor: '#F5F7FA',
                  paper_bgcolor: '#FFFFFF',
                  margin: { l: 150 },
                  height: 350,
                }}
                config={{ responsive: true }}
              />
            </div>
          </div>
        )}

        {/* Entity Mention Distribution */}
        {issues.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-body">
              <Plot
                data={[{
                  labels: issues.slice(0, 6).map(i => i.issue_name || 'Unknown'),
                  values: issues.slice(0, 6).map(i => i.volume || 0),
                  type: 'pie',
                  marker: {
                    colors: ['#0074D9', '#2ECC71', '#E67E22', '#E74C3C', '#9B59B6', '#1ABC9C']
                  }
                }]}
                layout={{
                  title: '✓ Entity Mention Distribution (Top 6)',
                  paper_bgcolor: '#FFFFFF',
                  height: 350,
                }}
                config={{ responsive: true }}
              />
            </div>
          </div>
        )}

        {/* Entity Data Table */}
        <div className="card">
          <div className="card-header">
            <span>✓ Entity Analysis (Actual Data)</span>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entity / Issue</th>
                  <th>Mentions</th>
                  <th>Avg Severity</th>
                  <th>Sentiment Impact</th>
                  <th>Regions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length > 0 ? (
                  issues.slice(0, 8).map(issue => (
                    <tr key={issue.issue_id}>
                      <td><strong>{issue.issue_name || 'Unknown'}</strong></td>
                      <td>{issue.volume || 0}</td>
                      <td>
                        <span className={`badge ${(issue.severity_score || 0) > 2.5 ? 'risk' : 'success'}`}>
                          {((issue.severity_score || 0) * 33).toFixed(0)}%
                        </span>
                      </td>
                      <td>{(issue.avg_sentiment || 0).toFixed(2)}</td>
                      <td>{riskByRegion.length}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No entity data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MOCK FUTURE INSIGHTS */}
      <div className="mock-banner">
        <h3>
          🚀 FUTURE INSIGHTS - Unlocks with More Data <span className="mock-indicator">MOCK</span>
        </h3>

        {/* Entity Demand vs Sentiment Quadrant */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                x: [2, 4, 1, 5, 3, 6, 2, 4],
                y: [0.6, 0.3, 0.8, 0.2, 0.7, 0.1, 0.5, 0.4],
                mode: 'markers+text',
                type: 'scatter',
                text: ['Roof Repair', 'Gutter', 'Siding', 'Inspection', 'Installation', 'Claims', 'Damage', 'Warranty'],
                textposition: 'top center',
                marker: {
                  size: [15, 20, 10, 25, 18, 12, 14, 16],
                  color: [0.6, 0.3, 0.8, 0.2, 0.7, 0.1, 0.5, 0.4],
                  colorscale: 'Viridis',
                  showscale: true,
                  colorbar: { title: 'Sentiment' }
                }
              }]}
              layout={{
                title: '🚀 Entity Demand vs Sentiment Quadrant (MOCK)',
                xaxis: { title: 'Demand (Mention Frequency)' },
                yaxis: { title: 'Sentiment Score' },
                plot_bgcolor: '#F5F7FA',
                paper_bgcolor: '#FFFFFF',
                height: 380,
                hovermode: 'closest'
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>

        {/* Entity × Issue Matrix */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                z: [
                  [8, 5, 3, 2],
                  [6, 9, 4, 1],
                  [4, 3, 7, 5],
                  [2, 6, 4, 8],
                  [5, 4, 6, 3]
                ],
                x: ['Roof Repair', 'Gutter', 'Siding', 'Installation'],
                y: ['Budget', 'Quality', 'Timeline', 'Safety', 'Coverage'],
                type: 'heatmap',
                colorscale: 'Blues'
              }]}
              layout={{
                title: '🚀 Entity × Issue Co-occurrence Matrix (MOCK)',
                xaxis: { title: 'Entity Type' },
                yaxis: { title: 'Issue Category' },
                paper_bgcolor: '#FFFFFF',
                height: 350,
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>

        {/* Competitor Presence */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                x: ['Company A', 'Company B', 'Company C', 'Company D'],
                y: [12, 8, 15, 6],
                type: 'bar',
                marker: { color: '#E67E22' }
              }]}
              layout={{
                title: '🚀 Competitor Mention Frequency (MOCK)',
                xaxis: { title: 'Competitor' },
                yaxis: { title: 'Mentions' },
                plot_bgcolor: '#F5F7FA',
                paper_bgcolor: '#FFFFFF',
                height: 300,
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>

        {/* What's Needed */}
        <div style={{
          background: 'white',
          border: '1px solid #E0E6ED',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <h4 style={{ marginBottom: '12px', color: '#8E44AD' }}>📋 To Unlock These Insights:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
            <li>Extended conversation history (3+ months)</li>
            <li>Explicit entity tagging (product/competitor mentions)</li>
            <li>Customer profile data (buyer personas)</li>
            <li>Outcome correlation (entity → conversion path)</li>
            <li>Competitor mention tracking & sentiment analysis</li>
          </ul>
        </div>
      </div>


    </div>
  );
}

export default FieldIntel;
