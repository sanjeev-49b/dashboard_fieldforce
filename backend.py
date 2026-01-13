"""
Field Intelligence Platform - Flask Backend
Clean architecture with proper filter propagation
All 14 endpoints with complete filter support
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database configuration - works for both local and Azure
DB_FILE = os.environ.get('DB_FILE', 'fieldforce.db')

# Test endpoint (no database needed)
@app.route('/test')
def test():
    """Simple test endpoint"""
    return jsonify({'status': 'success', 'message': 'Backend is working!', 'timestamp': datetime.now().isoformat()})

# Serve React app
@app.route('/')
def serve():
    """Serve the React app"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or React app"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# ============================================================================
# DATABASE & UTILITY FUNCTIONS
# ============================================================================

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    """Convert sqlite3.Row to dict"""
    return dict(row) if row else {}

def rows_to_dicts(rows):
    """Convert list of sqlite3.Row to list of dicts"""
    return [dict(row) for row in rows]

# ============================================================================
# FILTER PARSING & APPLICATION
# ============================================================================

def parse_filters(request_args):
    """Parse filters from request query parameters"""
    filters = {}
    
    # Time range (required)
    filters['time_range'] = request_args.get('time_range', '7')
    
    # Optional IDs (convert to int)
    for key in ['region_id', 'team_id', 'channel_id', 'client_type_id']:
        val = request_args.get(key)
        if val:
            try:
                filters[key] = int(val)
            except ValueError:
                pass
    
    return filters

def build_where_clause(filters):
    """Build WHERE clause with all applicable filters"""
    where_parts = []
    
    # Date filter
    days = filters.get('time_range', '7')
    where_parts.append(f"dd.calendar_date >= date('now', '-{days} days')")
    
    # Region filter
    if 'region_id' in filters:
        where_parts.append(f"fc.region_id = {filters['region_id']}")
    
    # Team filter
    if 'team_id' in filters:
        where_parts.append(f"fc.team_id = {filters['team_id']}")
    
    # Channel filter
    if 'channel_id' in filters:
        where_parts.append(f"fc.channel_id = {filters['channel_id']}")
    
    # Client type filter
    if 'client_type_id' in filters:
        where_parts.append(f"fc.client_type_id = {filters['client_type_id']}")
    
    return " AND ".join(where_parts)

# ============================================================================
# SYSTEM ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM fact_conversation")
        count = cursor.fetchone()[0]
        conn.close()
        return jsonify({'status': 'healthy', 'conversations': count})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/filters/dimensions', methods=['GET'])
def get_filter_dimensions():
    """Get all available filter options"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Regions
        cursor.execute("SELECT region_id, region_name FROM dim_region ORDER BY region_name")
        regions = rows_to_dicts(cursor.fetchall())
        
        # Teams
        cursor.execute("SELECT team_id, team_name FROM dim_team ORDER BY team_name")
        teams = rows_to_dicts(cursor.fetchall())
        
        # Channels
        cursor.execute("SELECT channel_id, channel_name FROM dim_channel ORDER BY channel_name")
        channels = rows_to_dicts(cursor.fetchall())
        
        # Client types
        cursor.execute("SELECT client_type_id, client_type_name FROM dim_client_type ORDER BY client_type_name")
        client_types = rows_to_dicts(cursor.fetchall())
        
        conn.close()
        
        return jsonify({
            'regions': regions,
            'teams': teams,
            'channels': channels,
            'client_types': client_types,
            'time_ranges': [
                {'label': 'Last 7 days', 'value': '7'},
                {'label': 'Last 30 days', 'value': '30'},
                {'label': 'Last 90 days', 'value': '90'},
                {'label': 'Last 12 months', 'value': '365'},
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MISSION BRIEF ENDPOINTS
# ============================================================================

@app.route('/api/mission-brief/tiles', methods=['GET'])
def mission_brief_tiles():
    """Get KPI tiles with ALL filters applied"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Total conversations
        cursor.execute(f"""
            SELECT COUNT(*) as count FROM fact_conversation fc
            JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause}
        """)
        total_convs = cursor.fetchone()['count'] or 0
        
        # Conversions
        cursor.execute(f"""
            SELECT SUM(CASE WHEN is_converted = 1 THEN 1 ELSE 0 END) as count
            FROM fact_conversation fc
            JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause}
        """)
        conversions = cursor.fetchone()['count'] or 0
        
        # Avg sentiment
        cursor.execute(f"""
            SELECT AVG(sentiment_score) as val FROM fact_conversation fc
            JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause}
        """)
        avg_sentiment = cursor.fetchone()['val'] or 0
        
        # Avg risk
        cursor.execute(f"""
            SELECT AVG(risk_score) as val FROM fact_conversation fc
            JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause}
        """)
        avg_risk = cursor.fetchone()['val'] or 0
        
        conn.close()
        
        conv_rate = (conversions / total_convs * 100) if total_convs > 0 else 0
        
        return jsonify({
            'tiles': [
                {'id': 'conversations', 'label': 'Total Conversations', 'value': total_convs, 'type': 'number'},
                {'id': 'conversions', 'label': 'Conversions', 'value': conversions, 'type': 'number'},
                {'id': 'conv_rate', 'label': 'Conversion Rate', 'value': f'{conv_rate:.1f}%', 'type': 'percent'},
                {'id': 'sentiment', 'label': 'Avg Sentiment', 'value': f'{avg_sentiment:.2f}', 'type': 'decimal'},
                {'id': 'risk', 'label': 'Avg Risk Score', 'value': f'{avg_risk:.1f}', 'type': 'decimal'},
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# FIELD SIGNAL ENDPOINTS
# ============================================================================

@app.route('/api/field-signal/pulse', methods=['GET'])
def signal_pulse():
    """Daily conversation pulse"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dd.calendar_date,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                AVG(fc.sentiment_score) as avg_sentiment,
                COUNT(CASE WHEN fc.severity = 'HIGH' THEN 1 END) as high_severity_count
            FROM dim_date dd
            LEFT JOIN fact_conversation fc ON dd.date_id = fc.date_id
            WHERE {where_clause}
            GROUP BY dd.date_id
            ORDER BY dd.calendar_date
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-signal/issues', methods=['GET'])
def signal_issues():
    """Top issues"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                di.issue_id,
                di.issue_name,
                COUNT(DISTINCT fc.conversation_id) as volume,
                AVG(fc.sentiment_score) as avg_sentiment,
                ROUND(AVG(CASE WHEN fc.severity = 'HIGH' THEN 3 
                                WHEN fc.severity = 'MEDIUM' THEN 2 ELSE 1 END), 2) as severity_score,
                COUNT(CASE WHEN fc.is_converted = 1 THEN 1 END) as conversions
            FROM dim_issue di
            LEFT JOIN fact_conversation fc ON di.issue_id = fc.issue_id
            LEFT JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY di.issue_id
            ORDER BY volume DESC
            LIMIT 10
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-signal/severity-distribution', methods=['GET'])
def signal_severity():
    """Severity distribution"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                severity,
                COUNT(*) as count
            FROM fact_conversation fc
            JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause}
            GROUP BY severity
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-signal/hotspots', methods=['GET'])
def signal_hotspots():
    """Geographic hotspots"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dr.region_id,
                dr.region_name,
                dr.latitude,
                dr.longitude,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.risk_score), 2) as avg_risk
            FROM dim_region dr
            LEFT JOIN fact_conversation fc ON dr.region_id = fc.region_id
            LEFT JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY dr.region_id
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# FIELD OPS ENDPOINTS
# ============================================================================

@app.route('/api/field-ops/agents', methods=['GET'])
def ops_agents():
    """Agent performance"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                da.agent_id,
                da.agent_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.sentiment_score), 2) as avg_sentiment,
                COUNT(CASE WHEN fc.is_converted = 1 THEN 1 END) as conversions,
                ROUND(AVG(fc.quality_score), 2) as avg_quality
            FROM dim_agent da
            LEFT JOIN fact_conversation fc ON da.agent_id = fc.agent_id
            LEFT JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY da.agent_id
            ORDER BY conversation_count DESC
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-ops/teams', methods=['GET'])
def ops_teams():
    """Team performance"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dt.team_id,
                dt.team_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.sentiment_score), 2) as avg_sentiment,
                COUNT(CASE WHEN fc.is_converted = 1 THEN 1 END) as conversions,
                ROUND(AVG(fc.quality_score), 2) as avg_quality
            FROM dim_team dt
            LEFT JOIN fact_conversation fc ON dt.team_id = fc.team_id
            LEFT JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY dt.team_id
            ORDER BY conversation_count DESC
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# FIELD STRATEGY ENDPOINTS
# ============================================================================

@app.route('/api/field-strategy/outcomes', methods=['GET'])
def strategy_outcomes():
    """Outcome distribution"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                do.outcome_id,
                do.outcome_name,
                COUNT(DISTINCT fo.outcome_event_id) as count
            FROM dim_outcome do
            LEFT JOIN fact_outcome fo ON do.outcome_id = fo.outcome_id
            LEFT JOIN dim_date dd ON fo.date_id = dd.date_id
            WHERE {where_clause} OR fo.outcome_event_id IS NULL
            GROUP BY do.outcome_id
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-strategy/risk-by-region', methods=['GET'])
def strategy_risk():
    """Risk by region"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dr.region_id,
                dr.region_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.risk_score), 2) as avg_risk,
                ROUND(AVG(fc.sentiment_score), 2) as avg_sentiment
            FROM dim_region dr
            LEFT JOIN fact_conversation fc ON dr.region_id = fc.region_id
            LEFT JOIN dim_date dd ON fc.date_id = dd.date_id
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY dr.region_id
            ORDER BY avg_risk DESC
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-strategy/outcome-trend', methods=['GET'])
def strategy_trend():
    """Outcome trend over time"""
    try:
        filters = parse_filters(request.args)
        days = filters.get('time_range', '7')
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dd.calendar_date,
                do.outcome_name,
                COUNT(DISTINCT fo.outcome_event_id) as outcome_count
            FROM dim_date dd
            LEFT JOIN fact_outcome fo ON dd.date_id = fo.date_id
            LEFT JOIN dim_outcome do ON fo.outcome_id = do.outcome_id
            WHERE dd.calendar_date >= date('now', '-{days} days')
            GROUP BY dd.date_id, do.outcome_id
            ORDER BY dd.calendar_date, do.outcome_id
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# FIELD HQ ENDPOINTS
# ============================================================================

@app.route('/api/field-hq/data-quality', methods=['GET'])
def hq_data_quality():
    """Data quality metrics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM fact_conversation")
        total_conversations = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM fact_conversation WHERE sentiment_score != 0")
        sentiment_coverage = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM fact_conversation_entities")
        entity_mentions = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(DISTINCT issue_id) FROM fact_conversation WHERE issue_id IS NOT NULL")
        issues_classified = cursor.fetchone()[0] or 0
        
        conn.close()
        
        sentiment_pct = (sentiment_coverage / total_conversations * 100) if total_conversations > 0 else 0
        
        return jsonify({
            'total_conversations': total_conversations,
            'sentiment_coverage_pct': round(sentiment_pct, 1),
            'entity_mentions': entity_mentions,
            'issues_classified': issues_classified,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    # Get port from environment variable for Azure, default to 5000 for local
    port = int(os.environ.get('PORT', 5000))
    # Use 0.0.0.0 for Azure deployment
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    app.run(debug=debug, port=port, host=host)
