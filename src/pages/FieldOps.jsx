import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

function FieldOps({ filters, loading, setLoading }) {
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params.append(k, v);
    });

    Promise.all([
      axios.get(`/api/mission-brief/tiles?${params}`),
      axios.get(`/api/field-ops/agents?${params}`),
      axios.get(`/api/field-ops/teams?${params}`),
    ])
      .then(([tilesRes, agentsRes, teamsRes]) => {
        setTiles(tilesRes.data.tiles || []);
        setAgents(agentsRes.data.data || []);
        setTeams(teamsRes.data.data || []);
      })
      .catch(err => console.error('Error loading Operations:', err))
      .finally(() => setLoading(false));
  }, [filters, setLoading]);

  const qualityScore = tiles.find(t => t.id === 'sentiment')?.value || '0.00';
  const topAgent = agents.length > 0 ? agents[0] : null;
  const topTeam = teams.length > 0 ? teams[0] : null;

  return (
    <div>
      {/* Header */}
      <div className="module-header">
        <h2>Operations</h2>
        <p>Agent & Team Performance Management</p>
      </div>

      {/* Core KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="metric-card">
          <span className="metric-label">👥 Total Agents</span>
          <div className="metric-value">{agents.length}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ {topAgent ? topAgent.agent_name : 'N/A'} (top performer)
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">👔 Teams</span>
          <div className="metric-value">{teams.length}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ {topTeam ? topTeam.team_name : 'N/A'} (leading)
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">💬 Avg Quality</span>
          <div className="metric-value secondary">{qualityScore}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Conversation quality index
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-label">📊 Avg Conversions</span>
          <div className="metric-value success">
            {agents.length > 0 ? (agents.reduce((sum, a) => sum + (a.conversions || 0), 0) / agents.length).toFixed(1) : '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            ✓ Per agent average
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
          ✓ ACTUAL DATA - Agent & Team Performance
        </h3>

        {/* Agent Performance Table */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <span>👥 Agent Performance Scorecard</span>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Conversations</th>
                  <th>Conversions</th>
                  <th>Conv Rate</th>
                  <th>Avg Sentiment</th>
                  <th>Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {agents.length > 0 ? (
                  agents.map(agent => {
                    const convRate = agent.conversation_count > 0 
                      ? ((agent.conversions || 0) / agent.conversation_count * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={agent.agent_id}>
                        <td><strong>{agent.agent_name}</strong></td>
                        <td>{agent.conversation_count}</td>
                        <td>{agent.conversions || 0}</td>
                        <td>
                          <span className="badge success">{convRate}%</span>
                        </td>
                        <td>{(agent.avg_sentiment || 0).toFixed(2)}</td>
                        <td>
                          <span className="badge info">{(agent.avg_quality || 0).toFixed(1)}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No agent data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Performance Table */}
        <div className="card">
          <div className="card-header">
            <span>👔 Team Performance Scorecard</span>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Total Conversations</th>
                  <th>Team Conversions</th>
                  <th>Conversion Rate</th>
                  <th>Avg Sentiment</th>
                  <th>Avg Quality</th>
                </tr>
              </thead>
              <tbody>
                {teams.length > 0 ? (
                  teams.map(team => {
                    const convRate = team.conversation_count > 0 
                      ? ((team.conversions || 0) / team.conversation_count * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={team.team_id}>
                        <td><strong>{team.team_name}</strong></td>
                        <td>{team.conversation_count}</td>
                        <td>{team.conversions || 0}</td>
                        <td>
                          <span className="badge success">{convRate}%</span>
                        </td>
                        <td>{(team.avg_sentiment || 0).toFixed(2)}</td>
                        <td>
                          <span className="badge info">{(team.avg_quality || 0).toFixed(1)}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No team data available</td>
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

        {/* Agent Performance Trend */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[
                {
                  x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  y: [75, 78, 82, 80, 85, 88],
                  name: 'Agent A',
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#0074D9' }
                },
                {
                  x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  y: [72, 75, 73, 77, 78, 82],
                  name: 'Agent B',
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#2ECC71' }
                },
                {
                  x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  y: [68, 70, 72, 75, 76, 79],
                  name: 'Agent C',
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#E67E22' }
                }
              ]}
              layout={{
                title: '🚀 Agent Performance Trend Over Time (MOCK)',
                xaxis: { title: 'Month' },
                yaxis: { title: 'Performance Score' },
                plot_bgcolor: '#F5F7FA',
                paper_bgcolor: '#FFFFFF',
                hovermode: 'x unified',
                margin: { t: 40, r: 20, b: 40, l: 60 },
                height: 320,
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '320px' }}
            />
          </div>
        </div>

        {/* Agent Conversion Funnel */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[{
                type: 'funnel',
                y: ['Initial Contact', 'Engagement', 'Problem Identified', 'Solution Offered', 'Converted'],
                x: [100, 85, 72, 60, 45],
                marker: { color: ['#0074D9', '#2ECC71', '#E67E22', '#E74C3C', '#9B59B6'] }
              }]}
              layout={{
                title: '🚀 Agent Conversion Efficiency Funnel (MOCK)',
                paper_bgcolor: '#FFFFFF',
                margin: { t: 40, r: 20, b: 20, l: 20 },
                height: 320,
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '320px' }}
            />
          </div>
        </div>

        {/* Team Comparison */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <Plot
              data={[
                {
                  x: ['Conversations', 'Conversions', 'Quality', 'Sentiment'],
                  y: [85, 92, 88, 79],
                  name: 'Team A',
                  type: 'bar',
                  marker: { color: '#0074D9' }
                },
                {
                  x: ['Conversations', 'Conversions', 'Quality', 'Sentiment'],
                  y: [72, 78, 75, 71],
                  name: 'Team B',
                  type: 'bar',
                  marker: { color: '#2ECC71' }
                }
              ]}
              layout={{
                title: '🚀 Team Comparison Dashboard (MOCK)',
                xaxis: { title: 'Metrics' },
                yaxis: { title: 'Score' },
                barmode: 'group',
                plot_bgcolor: '#F5F7FA',
                paper_bgcolor: '#FFFFFF',
                margin: { t: 40, r: 20, b: 40, l: 60 },
                height: 320,
              }}
              config={{ responsive: true }}
              style={{ width: '100%', height: '320px' }}
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
            <li>Historical performance data (3+ months of agent activity)</li>
            <li>Agent coaching & skill level tracking</li>
            <li>Customer satisfaction scores per agent</li>
            <li>Agent schedule & availability data</li>
            <li>Real-time performance dashboarding & alerts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FieldOps;
