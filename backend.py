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
# For Azure: Check multiple locations (wwwroot and persistent storage)
# For local: ./field_intelligence.db
if os.path.exists('/home/site/wwwroot'):
    # Running on Azure - check wwwroot first (deployment location)
    if os.path.exists('/home/site/wwwroot/field_intelligence.db'):
        DB_FILE = '/home/site/wwwroot/field_intelligence.db'
    elif os.path.exists('/home/site/field_intelligence.db'):
        DB_FILE = '/home/site/field_intelligence.db'
    else:
        DB_FILE = os.environ.get('DB_FILE', '/home/site/wwwroot/field_intelligence.db')
else:
    # Running locally
    DB_FILE = os.environ.get('DB_FILE', 'field_intelligence.db')

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
    # Note: team_id maps to channel_id since we use channels as teams proxy
    for key in ['region_id', 'channel_id', 'team_id']:
        val = request_args.get(key)
        if val:
            try:
                filters[key] = int(val)
            except ValueError:
                pass
    
    # Map team_id to channel_id if team_id is provided (since teams = channels in our schema)
    if 'team_id' in filters and 'channel_id' not in filters:
        filters['channel_id'] = filters['team_id']
    
    return filters

def build_where_clause(filters, use_date_join=True):
    """Build WHERE clause with all applicable filters"""
    where_parts = []
    
    # Date filter - join on call_date = calendar_date
    days = filters.get('time_range', '7')
    if use_date_join:
        where_parts.append(f"dd.calendar_date >= date('now', '-{days} days')")
    else:
        where_parts.append(f"fc.call_date >= date('now', '-{days} days')")
    
    # Region filter
    if 'region_id' in filters:
        where_parts.append(f"fc.region_id = {filters['region_id']}")
    
    # Channel filter
    if 'channel_id' in filters:
        where_parts.append(f"fc.channel_id = {filters['channel_id']}")
    
    return " AND ".join(where_parts) if where_parts else "1=1"

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
        
        # Channels
        cursor.execute("SELECT channel_id, channel_name FROM dim_channel ORDER BY channel_name")
        channels = rows_to_dicts(cursor.fetchall())
        
        # Teams - using channels as proxy since dim_team doesn't exist
        # Map channel_id/channel_name to team_id/team_name for frontend compatibility
        teams = [{'team_id': ch['channel_id'], 'team_name': ch['channel_name']} for ch in channels]
        
        # Agents (for reference, not used as filter in current schema)
        cursor.execute("SELECT agent_id, agent_name FROM dim_agent ORDER BY agent_name")
        agents = rows_to_dicts(cursor.fetchall())
        
        conn.close()
        
        return jsonify({
            'regions': regions,
            'teams': teams,  # Using channels as proxy
            'channels': channels,
            'client_types': [],  # Not available in current schema
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
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Total conversations - join on call_date = calendar_date
        cursor.execute(f"""
            SELECT COUNT(*) as count FROM fact_conversation fc
            JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause}
        """)
        total_convs = cursor.fetchone()['count'] or 0
        
        # Conversions - using has_appointment (1 = has appointment)
        cursor.execute(f"""
            SELECT SUM(CASE WHEN has_appointment = 1 THEN 1 ELSE 0 END) as count
            FROM fact_conversation fc
            JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause}
        """)
        conversions = cursor.fetchone()['count'] or 0
        
        # Avg sentiment - using overall_sentiment
        cursor.execute(f"""
            SELECT AVG(overall_sentiment) as val FROM fact_conversation fc
            JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause} AND fc.overall_sentiment IS NOT NULL
        """)
        avg_sentiment = cursor.fetchone()['val'] or 0
        
        # Conversion confidence as proxy for risk (higher confidence = lower risk)
        cursor.execute(f"""
            SELECT AVG(conversion_confidence) as val FROM fact_conversation fc
            JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause} AND fc.conversion_confidence IS NOT NULL
        """)
        avg_confidence = cursor.fetchone()['val'] or 0
        # Convert confidence to risk (inverse, scaled 0-100)
        avg_risk = 100 - (avg_confidence * 100) if avg_confidence else 0
        
        conn.close()
        
        conv_rate = (conversions / total_convs * 100) if total_convs > 0 else 0
        
        return jsonify({
            'tiles': [
                {'id': 'conversations', 'label': 'Total Conversations', 'value': total_convs, 'type': 'number'},
                {'id': 'conversions', 'label': 'Appointments', 'value': conversions, 'type': 'number'},
                {'id': 'conv_rate', 'label': 'Appointment Rate', 'value': f'{conv_rate:.1f}%', 'type': 'percent'},
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
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dd.calendar_date,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                AVG(fc.overall_sentiment) as avg_sentiment,
                COUNT(CASE WHEN fc.has_appointment = 1 THEN 1 END) as high_severity_count
            FROM dim_date dd
            LEFT JOIN fact_conversation fc ON dd.calendar_date = fc.call_date
            WHERE {where_clause}
            GROUP BY dd.date_id, dd.calendar_date
            ORDER BY dd.calendar_date
        """)
        data = rows_to_dicts(cursor.fetchall())
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-signal/issues', methods=['GET'])
def signal_issues():
    """Top issues - using outcome_status as proxy for issues"""
    try:
        filters = parse_filters(request.args)
        # Build WHERE clause without date join for this query
        days = filters.get('time_range', '7')
        where_parts = [f"fc.call_date >= date('now', '-{days} days')"]
        
        if 'region_id' in filters:
            where_parts.append(f"fc.region_id = {filters['region_id']}")
        if 'channel_id' in filters:
            where_parts.append(f"fc.channel_id = {filters['channel_id']}")
        
        where_clause = " AND ".join(where_parts) if where_parts else "1=1"
        
        conn = get_db()
        cursor = conn.cursor()
        # Group by outcome_status/reason_for_outcome since issue table doesn't exist
        cursor.execute(f"""
            SELECT 
                COALESCE(fc.outcome_status, 'Unknown') as issue_name,
                COUNT(DISTINCT fc.conversation_id) as volume,
                ROUND(AVG(fc.overall_sentiment), 2) as avg_sentiment,
                ROUND(AVG(CASE WHEN fc.has_appointment = 1 THEN 3 
                                WHEN fc.conversion_confidence > 0.5 THEN 2 ELSE 1 END), 2) as severity_score,
                COUNT(CASE WHEN fc.has_appointment = 1 THEN 1 END) as conversions
            FROM fact_conversation fc
            WHERE {where_clause}
            GROUP BY fc.outcome_status, fc.reason_for_outcome
            ORDER BY volume DESC
            LIMIT 10
        """)
        rows = cursor.fetchall()
        # Convert to dicts and ensure issue_id is integer
        data = []
        for idx, row in enumerate(rows, 1):
            data.append({
                'issue_id': idx,
                'issue_name': row['issue_name'] or 'Unknown',
                'volume': row['volume'] or 0,
                'avg_sentiment': row['avg_sentiment'] or 0,
                'severity_score': row['severity_score'] or 0,
                'conversions': row['conversions'] or 0
            })
        conn.close()
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-signal/severity-distribution', methods=['GET'])
def signal_severity():
    """Severity distribution - using conversion_confidence as proxy"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                CASE 
                    WHEN conversion_confidence >= 0.7 THEN 'HIGH'
                    WHEN conversion_confidence >= 0.4 THEN 'MEDIUM'
                    ELSE 'LOW'
                END as severity,
                COUNT(*) as count
            FROM fact_conversation fc
            JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause}
            GROUP BY 
                CASE 
                    WHEN conversion_confidence >= 0.7 THEN 'HIGH'
                    WHEN conversion_confidence >= 0.4 THEN 'MEDIUM'
                    ELSE 'LOW'
                END
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
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dr.region_id,
                dr.region_name,
                dr.latitude,
                dr.longitude,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(100 - AVG(COALESCE(fc.conversion_confidence, 0.5) * 100), 2) as avg_risk
            FROM dim_region dr
            LEFT JOIN fact_conversation fc ON dr.region_id = fc.region_id
            LEFT JOIN dim_date dd ON fc.call_date = dd.calendar_date
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
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                da.agent_id,
                da.agent_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.overall_sentiment), 2) as avg_sentiment,
                COUNT(CASE WHEN fc.has_appointment = 1 THEN 1 END) as conversions,
                ROUND(AVG(fc.conversion_confidence), 2) as avg_quality
            FROM dim_agent da
            LEFT JOIN fact_conversation fc ON da.agent_id = fc.agent_id
            LEFT JOIN dim_date dd ON fc.call_date = dd.calendar_date
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
    """Team performance - using channel as proxy for teams since dim_team doesn't exist"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dc.channel_id as team_id,
                dc.channel_name as team_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(AVG(fc.overall_sentiment), 2) as avg_sentiment,
                COUNT(CASE WHEN fc.has_appointment = 1 THEN 1 END) as conversions,
                ROUND(AVG(fc.conversion_confidence), 2) as avg_quality
            FROM dim_channel dc
            LEFT JOIN fact_conversation fc ON dc.channel_id = fc.channel_id
            LEFT JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause} OR fc.conversation_id IS NULL
            GROUP BY dc.channel_id
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
    """Outcome distribution - using outcome_status from fact_conversation"""
    try:
        filters = parse_filters(request.args)
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                COALESCE(fc.outcome_status, 'Unknown') as outcome_name,
                COALESCE(fc.outcome_status, 'Unknown') as outcome_id,
                COUNT(DISTINCT fc.conversation_id) as count
            FROM fact_conversation fc
            LEFT JOIN dim_date dd ON fc.call_date = dd.calendar_date
            WHERE {where_clause}
            GROUP BY fc.outcome_status
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
        where_clause = build_where_clause(filters, use_date_join=True)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dr.region_id,
                dr.region_name,
                COUNT(DISTINCT fc.conversation_id) as conversation_count,
                ROUND(100 - AVG(COALESCE(fc.conversion_confidence, 0.5) * 100), 2) as avg_risk,
                ROUND(AVG(fc.overall_sentiment), 2) as avg_sentiment
            FROM dim_region dr
            LEFT JOIN fact_conversation fc ON dr.region_id = fc.region_id
            LEFT JOIN dim_date dd ON fc.call_date = dd.calendar_date
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
    """Outcome trend over time - using outcome_status from fact_conversation"""
    try:
        filters = parse_filters(request.args)
        days = filters.get('time_range', '7')
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                dd.calendar_date,
                COALESCE(fc.outcome_status, 'Unknown') as outcome_name,
                COUNT(DISTINCT fc.conversation_id) as outcome_count
            FROM dim_date dd
            LEFT JOIN fact_conversation fc ON dd.calendar_date = fc.call_date
            WHERE dd.calendar_date >= date('now', '-{days} days')
            GROUP BY dd.date_id, dd.calendar_date, fc.outcome_status
            ORDER BY dd.calendar_date, fc.outcome_status
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
        
        cursor.execute("SELECT COUNT(*) FROM fact_conversation WHERE overall_sentiment IS NOT NULL")
        sentiment_coverage = cursor.fetchone()[0] or 0
        
        # Check if fact_entity_mention exists (different name in actual schema)
        try:
            cursor.execute("SELECT COUNT(*) FROM fact_entity_mention")
            entity_mentions = cursor.fetchone()[0] or 0
        except:
            entity_mentions = 0
        
        cursor.execute("SELECT COUNT(DISTINCT outcome_status) FROM fact_conversation WHERE outcome_status IS NOT NULL")
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
