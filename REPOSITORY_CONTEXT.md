# Field Intelligence Platform - Repository Context & Database Schema

## 📋 Overview

This document provides a comprehensive overview of the Field Intelligence Platform repository, with special focus on the `field_intelligence.db` database structure and internal workings.

**Last Updated:** Based on current repository state
**Database File:** `field_intelligence.db` (SQLite)

---

## 🗄️ Database Schema - `field_intelligence.db`

### **Key Facts:**
- **Database Type:** SQLite 3
- **Current Data:** 9 conversations, 8 agents, 5 regions, 4 channels, 135 entities
- **Schema Type:** Star Schema (dimensional modeling)

### **Dimension Tables**

#### `dim_date`
- **Purpose:** Date dimension for time-based analysis
- **Columns:**
  - `date_id` (INTEGER, PRIMARY KEY) - Format: YYYYMMDD
  - `calendar_date` (DATE) - Actual date
  - `day_of_week` (INTEGER)
  - `day_name` (TEXT)
  - `week_of_year` (INTEGER)
  - `month` (INTEGER)
  - `month_name` (TEXT)
  - `quarter` (INTEGER)
  - `year` (INTEGER)
  - `is_weekend` (INTEGER, DEFAULT 0)

#### `dim_region`
- **Purpose:** Geographic regions
- **Columns:**
  - `region_id` (INTEGER, PRIMARY KEY)
  - `region_name` (TEXT, NOT NULL)
  - `state` (TEXT)
  - `latitude` (REAL)
  - `longitude` (REAL)
- **Current Data:** 5 regions

#### `dim_agent`
- **Purpose:** Sales/customer service agents
- **Columns:**
  - `agent_id` (INTEGER, PRIMARY KEY)
  - `agent_name` (TEXT, NOT NULL)
  - `team_name` (TEXT, DEFAULT 'Dr. Roof')
  - `region_id` (INTEGER)
  - `status` (TEXT, DEFAULT 'active')
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 8 agents

#### `dim_channel`
- **Purpose:** Communication channels
- **Columns:**
  - `channel_id` (INTEGER, PRIMARY KEY)
  - `channel_name` (TEXT, NOT NULL)
- **Current Data:** 4 channels (Phone, Email, Chat, In-Person)
- **Note:** Used as proxy for teams in backend queries

#### `dim_entity`
- **Purpose:** Extracted entities from conversations (products, features, locations, etc.)
- **Columns:**
  - `entity_id` (INTEGER, PRIMARY KEY)
  - `entity_name` (TEXT, NOT NULL)
  - `entity_type` (TEXT, NOT NULL)
  - `entity_alias` (TEXT)
  - `source` (TEXT)
  - `discovery_status` (TEXT, DEFAULT 'approved')
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 135 entities

#### `dim_entity_type`
- **Purpose:** Categories of entities
- **Columns:**
  - `entity_type` (TEXT, PRIMARY KEY)
  - `description` (TEXT)
- **Current Data:** 8 entity types

#### `dim_customer`
- **Purpose:** Customer information
- **Columns:**
  - `customer_id` (INTEGER, PRIMARY KEY)
  - `customer_name` (TEXT)
  - `customer_phone` (TEXT)
  - `customer_email` (TEXT)
  - `customer_address` (TEXT)
  - `customer_city` (TEXT)
  - `region_id` (INTEGER)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 9 customers

#### `dim_transcript`
- **Purpose:** Raw conversation transcripts
- **Columns:**
  - `transcript_id` (INTEGER, PRIMARY KEY)
  - `transcript_filename` (TEXT, NOT NULL)
  - `raw_transcript` (TEXT)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 9 transcripts

---

### **Fact Tables**

#### `fact_conversation` ⭐ **MAIN TABLE**
- **Purpose:** Core conversation facts - the primary fact table
- **Columns:**
  - `conversation_id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
  - `agent_id` (INTEGER, NOT NULL) → References `dim_agent.agent_id`
  - `customer_id` (INTEGER, NOT NULL) → References `dim_customer.customer_id`
  - `region_id` (INTEGER) → References `dim_region.region_id`
  - `call_date` (DATE, NOT NULL) ⚠️ **Important:** Used for date joins (not date_id)
  - `channel_id` (INTEGER, DEFAULT 1) → References `dim_channel.channel_id`
  - `call_duration_minutes` (REAL)
  - `overall_sentiment` (REAL) - Sentiment score (-1 to 1 or similar)
  - `funnel_stage` (TEXT) - Sales funnel stage
  - `outcome_status` (TEXT) - Outcome classification
  - `conversion_confidence` (REAL) - Confidence score (0-1, used for risk calculation)
  - `has_appointment` (INTEGER, DEFAULT 0) - 1 if appointment scheduled
  - `appointment_date` (DATE)
  - `appointment_status` (TEXT)
  - `reason_for_outcome` (TEXT)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 9 conversations
- **Key Usage:** This is the primary table queried by the backend API

#### `fact_entity_mention`
- **Purpose:** Entity mentions extracted from conversations
- **Columns:**
  - `mention_id` (INTEGER, PRIMARY KEY)
  - `conversation_id` (INTEGER, NOT NULL) → References `fact_conversation.conversation_id`
  - `entity_id` (INTEGER) → References `dim_entity.entity_id`
  - `entity_type` (TEXT)
  - `mention_text` (TEXT, NOT NULL)
  - `speaker_role` (TEXT) - 'agent' or 'customer'
  - `position_in_transcript` (INTEGER)
  - `context_before` (TEXT)
  - `context_after` (TEXT)
  - `full_sentence` (TEXT)
  - `sentiment_polarity` (TEXT)
  - `sentiment_confidence` (REAL)
  - `extraction_method` (TEXT)
  - `method_count` (INTEGER)
  - `confidence` (REAL)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 212 mentions

#### `fact_entity_signal`
- **Purpose:** Signals derived from entity mentions
- **Columns:**
  - `signal_id` (INTEGER, PRIMARY KEY)
  - `mention_id` (INTEGER, NOT NULL) → References `fact_entity_mention.mention_id`
  - `signal_type` (TEXT)
  - `signal_category` (TEXT)
  - `sentiment_polarity` (TEXT)
  - `sentiment_confidence` (REAL)
  - `behavioral_tag` (TEXT)
  - `suggested_funnel_stage` (TEXT)
  - `key_insight` (TEXT)
  - `llm_model` (TEXT)
  - `nuextract_response` (TEXT)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 148 signals

#### `fact_agent_behavior_per_mention`
- **Purpose:** Agent behavior metrics per entity mention
- **Columns:**
  - `behavior_id` (INTEGER, PRIMARY KEY)
  - `mention_id` (INTEGER, NOT NULL) → References `fact_entity_mention.mention_id`
  - `agent_empathy` (REAL)
  - `agent_clarity` (REAL)
  - `agent_confidence` (REAL)
  - `agent_knowledge` (REAL)
  - `agent_listening` (REAL)
  - `overall_agent_score` (REAL)
  - `behavioral_strengths` (TEXT)
  - `behavioral_gaps` (TEXT)
  - `coaching_focus` (TEXT)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 71 behavior records

#### `fact_conversation_signal_summary`
- **Purpose:** Aggregated signal summaries per conversation
- **Columns:**
  - `summary_id` (INTEGER, PRIMARY KEY)
  - `conversation_id` (INTEGER, NOT NULL)
  - `positive_signals` (INTEGER, DEFAULT 0)
  - `negative_signals` (INTEGER, DEFAULT 0)
  - `net_signal_score` (INTEGER, DEFAULT 0)
  - `objections_count` (INTEGER, DEFAULT 0)
  - `objections_resolved` (INTEGER, DEFAULT 0)
  - `objection_resolution_rate` (REAL, DEFAULT 0.0)
  - `buying_signals` (INTEGER, DEFAULT 0)
  - `buying_signal_density` (REAL, DEFAULT 0.0)
  - `customer_concerns` (INTEGER, DEFAULT 0)
  - `concern_resolution_rate` (REAL, DEFAULT 0.0)
  - `missed_opportunities` (INTEGER, DEFAULT 0)
  - `overall_signal_quality` (REAL, DEFAULT 0.0)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 0 records (empty table)

#### `fact_entity_signal_graph`
- **Purpose:** Graph relationships between entities and signals
- **Columns:**
  - `edge_id` (INTEGER, PRIMARY KEY)
  - `source_entity_id` (INTEGER, NOT NULL)
  - `signal_id` (INTEGER, NOT NULL)
  - `target_entity_id` (INTEGER, NOT NULL)
  - `mention_sequence` (INTEGER)
  - `time_between_mentions` (INTEGER)
  - `signal_path_strength` (REAL)
  - `co_occurrence_count` (INTEGER, DEFAULT 1)
  - `conversation_id` (INTEGER)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 0 records (empty table)

---

### **Aggregation Tables** (Currently Empty)

These tables are designed for pre-computed aggregations but currently contain no data:
- `agg_daily_conversation`
- `agg_daily_entity_region`
- `agg_daily_issue_region`
- `agg_agent_performance`
- `agg_entity_demand`
- `agg_conversion_funnel`
- `agg_signal_sentiment`
- `agg_regional_performance`
- `agg_agent_behavior_scorecard`

---

### **Staging Tables**

#### `stg_discovered_entities`
- **Purpose:** Staging area for newly discovered entities awaiting review
- **Columns:**
  - `discovered_entity_id` (INTEGER, PRIMARY KEY)
  - `conversation_id` (INTEGER, NOT NULL)
  - `entity_text` (TEXT, NOT NULL)
  - `proposed_entity_type` (TEXT)
  - `extraction_method` (TEXT)
  - `confidence` (REAL)
  - `semantic_similarity_score` (REAL)
  - `context_window` (TEXT)
  - `speaker_role` (TEXT)
  - `frequency_in_transcript` (INTEGER)
  - `review_status` (TEXT, DEFAULT 'PENDING')
  - `mapped_to_entity_id` (INTEGER)
  - `reviewer_notes` (TEXT)
  - `reviewed_at` (TIMESTAMP)
  - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Current Data:** 46 discovered entities pending review

---

### **Reference Tables**

#### `ref_funnel_stage`
- **Purpose:** Reference data for sales funnel stages
- **Columns:**
  - `funnel_stage` (TEXT, PRIMARY KEY)
  - `stage_order` (INTEGER)
- **Current Data:** 10 funnel stages

---

## 🔌 Backend API (`backend.py`)

### **Database Connection**
- **File Location:** 
  - Local: `./field_intelligence.db`
  - Azure: `/home/site/field_intelligence.db`
- **Configuration:** Set via `DB_FILE` environment variable

### **Key Query Patterns**

#### **Date Joins:**
⚠️ **Critical:** The backend uses `call_date` (DATE) directly, NOT `date_id`:
```sql
JOIN dim_date dd ON fc.call_date = dd.calendar_date
```

#### **Filter Application:**
Filters are applied via `build_where_clause()` function:
- Time range: `call_date >= date('now', '-{days} days')`
- Region: `region_id = {region_id}`
- Channel: `channel_id = {channel_id}` (used as proxy for teams)

#### **Common Query Structure:**
```sql
SELECT ...
FROM fact_conversation fc
JOIN dim_date dd ON fc.call_date = dd.calendar_date
WHERE dd.calendar_date >= date('now', '-{days} days')
  AND fc.region_id = {region_id}  -- if filtered
  AND fc.channel_id = {channel_id}  -- if filtered
```

### **API Endpoints (14 total)**

#### System
- `GET /api/health` - Health check
- `GET /api/filters/dimensions` - Get filter options

#### Mission Brief
- `GET /api/mission-brief/tiles` - KPI tiles

#### Field Signal
- `GET /api/field-signal/pulse` - Daily conversation pulse
- `GET /api/field-signal/issues` - Top issues (uses `outcome_status` as proxy)
- `GET /api/field-signal/severity-distribution` - Severity distribution (uses `conversion_confidence`)
- `GET /api/field-signal/hotspots` - Geographic hotspots

#### Field Operations
- `GET /api/field-ops/agents` - Agent performance
- `GET /api/field-ops/teams` - Team performance (uses channels as proxy)

#### Field Strategy
- `GET /api/field-strategy/outcomes` - Outcome distribution
- `GET /api/field-strategy/risk-by-region` - Risk by region
- `GET /api/field-strategy/outcome-trend` - Outcome trends over time

#### Field HQ
- `GET /api/field-hq/data-quality` - Data quality metrics

---

## 🎨 Frontend Architecture

### **Technology Stack**
- **Framework:** React 18.2
- **Visualization:** Plotly.js (via react-plotly.js)
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **State Management:** React Context API (FilterContext)

### **Page Modules**
1. **Home** (`src/pages/Home.jsx`) - Dashboard with configurable charts
2. **Field Signal** (`src/pages/FieldSignal.jsx`) - Real-time pulse, issues, severity, hotspots
3. **Field Intel** (`src/pages/FieldIntel.jsx`) - Entity & competitor intelligence
4. **Field Operations** (`src/pages/FieldOps.jsx`) - Agent & team performance
5. **Field Strategy** (`src/pages/FieldStrategy.jsx`) - Strategic insights & risk analysis
6. **Field HQ** (`src/pages/FieldHQ.jsx`) - Admin & governance

### **Components**
- `Login.jsx` - Authentication (hardcoded: org="DR.ROOF", user="admin", pass="admin pass")
- `GlobalFilters.jsx` - Top filter bar (time range, region, team)
- `ContextualFilters.jsx` - Sidebar filters (context-aware)
- `DrilldownPanel.jsx` - Detail view for drill-down analysis
- `MetricCard.jsx` - Reusable metric display
- `Header.jsx` / `Navigation.jsx` - Navigation components

### **Filter System**
- **Global State:** Managed via `FilterContext`
- **Filter Types:** time_range, region_id, team_id, channel_id, client_type_id
- **Propagation:** Filters automatically propagate to all API calls via query parameters

---

## 🔑 Key Design Patterns

### **Database Design**
1. **Star Schema:** Classic dimensional modeling
2. **Date Handling:** Uses DATE fields directly, not just date_id foreign keys
3. **Proxy Mappings:** Channels used as proxy for teams (dim_team doesn't exist in actual schema)
4. **Signal Processing:** Multi-layer fact tables (conversation → entity_mention → entity_signal)

### **Backend Patterns**
1. **Filter Propagation:** All endpoints accept same filter parameters
2. **Dynamic WHERE Clauses:** Built programmatically based on filter state
3. **Error Handling:** Try-catch blocks with JSON error responses
4. **CORS:** Enabled for all `/api/*` routes

### **Frontend Patterns**
1. **Context API:** Filter state shared via FilterContext
2. **Effect Hooks:** Data fetching triggered by filter changes
3. **Promise.all:** Parallel API calls for efficiency
4. **Conditional Rendering:** Shows "No data" states gracefully

---

## ⚠️ Important Notes & Discrepancies

### **Schema Mismatch:**
- `create_sample_database.py` defines a different schema than what's actually in use
- The actual database uses `call_date` (DATE), but the sample script defines `date_id` (INTEGER FK)
- Actual schema is more sophisticated with entity extraction, signals, and behavior tracking

### **Data Relationships:**
- **Conversations → Agents:** Many-to-one (each conversation has one agent)
- **Conversations → Customers:** Many-to-one
- **Conversations → Entity Mentions:** One-to-many (one conversation can have many entity mentions)
- **Entity Mentions → Entity Signals:** One-to-many
- **Agents → Teams:** Currently using channels as proxy (team_name stored in dim_agent)

### **Calculated Fields:**
- **Risk Score:** Calculated as `100 - (conversion_confidence * 100)` (inverse of confidence)
- **Conversion Rate:** `(conversions / total_conversations) * 100`
- **Severity:** Derived from `conversion_confidence` thresholds:
  - HIGH: >= 0.7
  - MEDIUM: >= 0.4
  - LOW: < 0.4

---

## 🚀 Development Guidelines

### **Adding New Endpoints:**
1. Follow filter pattern: Use `parse_filters()` and `build_where_clause()`
2. Use `get_db()` for connections
3. Use `rows_to_dicts()` for result formatting
4. Return JSON with proper error handling

### **Adding New Tables:**
1. Follow naming convention: `dim_*` for dimensions, `fact_*` for facts, `agg_*` for aggregations
2. Include `created_at` timestamp
3. Use appropriate foreign keys
4. Update `backend.py` if needed for new dimensions/filters

### **Querying the Database:**
```python
conn = get_db()
cursor = conn.cursor()
cursor.execute("SELECT ... FROM fact_conversation fc JOIN ...")
data = rows_to_dicts(cursor.fetchall())
conn.close()
```

---

## 📊 Current Data Summary

- **Conversations:** 9
- **Agents:** 8
- **Regions:** 5
- **Channels:** 4
- **Customers:** 9
- **Entities:** 135
- **Entity Mentions:** 212
- **Entity Signals:** 148
- **Agent Behavior Records:** 71
- **Discovered Entities (Pending):** 46
- **Date Records:** 3

---

## 🔍 Useful SQL Queries

### **Get all conversations with details:**
```sql
SELECT 
  fc.conversation_id,
  fc.call_date,
  da.agent_name,
  dc.customer_name,
  dr.region_name,
  fc.overall_sentiment,
  fc.conversion_confidence,
  fc.has_appointment,
  fc.outcome_status
FROM fact_conversation fc
LEFT JOIN dim_agent da ON fc.agent_id = da.agent_id
LEFT JOIN dim_customer dc ON fc.customer_id = dc.customer_id
LEFT JOIN dim_region dr ON fc.region_id = dr.region_id
ORDER BY fc.call_date DESC;
```

### **Get entity mentions per conversation:**
```sql
SELECT 
  fc.conversation_id,
  fc.call_date,
  COUNT(fem.mention_id) as mention_count,
  GROUP_CONCAT(de.entity_name, ', ') as entities
FROM fact_conversation fc
LEFT JOIN fact_entity_mention fem ON fc.conversation_id = fem.conversation_id
LEFT JOIN dim_entity de ON fem.entity_id = de.entity_id
GROUP BY fc.conversation_id
ORDER BY mention_count DESC;
```

### **Get agent performance summary:**
```sql
SELECT 
  da.agent_id,
  da.agent_name,
  COUNT(fc.conversation_id) as total_conversations,
  SUM(fc.has_appointment) as conversions,
  AVG(fc.overall_sentiment) as avg_sentiment,
  AVG(fc.conversion_confidence) as avg_confidence
FROM dim_agent da
LEFT JOIN fact_conversation fc ON da.agent_id = fc.agent_id
GROUP BY da.agent_id
ORDER BY total_conversations DESC;
```

---

## 📝 File Structure Reference

```
FieldForce_V2.1_App-main/
├── backend.py                    # Flask API server (main backend)
├── field_intelligence.db         # SQLite database ⭐
├── create_sample_database.py     # ⚠️ Outdated schema definition
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
├── src/
│   ├── App.jsx                   # Main React app
│   ├── components/               # Reusable components
│   ├── pages/                    # Page modules
│   └── styles/                   # CSS files
└── public/                       # Static assets
```

---

**This document serves as a comprehensive reference for understanding the database structure and system architecture. Keep it updated as the system evolves.**




