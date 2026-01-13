================================================================================
FIELD INTELLIGENCE PLATFORM - SETUP & DEPLOYMENT GUIDE
================================================================================

Version: 1.0.0
Date: 2025-12-29
Status: Beta (Phase 1 - Mission Brief, Field Signal Complete)

================================================================================
ARCHITECTURE OVERVIEW
================================================================================

BACKEND:
  - Python Flask (backend.py)
  - SQLite database integration
  - REST API with filter state management
  - DDIM (drill-down) support

FRONTEND:
  - React 18 with Hooks
  - Plotly.js for visualizations
  - CSS3 with design system variables
  - Filter context for global state

================================================================================
QUICK START - 5 MINUTES
================================================================================

1. BACKEND SETUP
   
   a) Copy backend.py to your Flask project:
      cp backend.py /path/to/your/project/
   
   b) Install dependencies:
      pip install Flask Flask-CORS pandas
   
   c) Update database path in backend.py line 15:
      DB_FILE = r'C:\Users\TEST\Desktop\DRAT\FieldForce_V2.1\data\fieldforce.db'
   
   d) Run Flask server:
      python backend.py
   
   Backend will run on: http://localhost:5000

2. FRONTEND SETUP
   
   a) Navigate to project directory:
      cd field-intelligence
   
   b) Install dependencies:
      npm install
   
   c) Start React dev server:
      npm start
   
   Frontend will run on: http://localhost:3000

3. VERIFY SETUP
   
   - Frontend loads at http://localhost:3000
   - Navigation bar shows all 6 modules
   - Filters appear in global bar and sidebar
   - Mission Brief shows KPI tiles
   - Field Signal shows charts and tables

================================================================================
PROJECT STRUCTURE
================================================================================

field-intelligence/
├── backend.py                          [Flask API backend]
├── package.json                        [React dependencies]
├── public/
│   └── index.html                      [HTML entry point]
├── src/
│   ├── App.jsx                         [Main app component]
│   ├── App.css                         [Global styles]
│   │
│   ├── components/
│   │   ├── Navigation.jsx              [Module tabs]
│   │   ├── GlobalFilters.jsx           [Time/Region/Team]
│   │   ├── ContextualFilters.jsx       [Channel/Client Type]
│   │   └── DrilldownPanel.jsx          [Detail panel]
│   │
│   ├── pages/
│   │   ├── MissionBrief.jsx            [KPI tiles, quick actions]
│   │   ├── FieldSignal.jsx             [Pulse, issues, severity]
│   │   ├── FieldIntel.jsx              [Placeholder]
│   │   ├── FieldOps.jsx                [Agent/team tables]
│   │   └── index.js                    [Strategy & HQ exports]
│   │
│   └── styles/
│       ├── App.css                     [Global design system]
│       ├── Navigation.css
│       ├── GlobalFilters.css
│       ├── ContextualFilters.css
│       ├── MissionBrief.css
│       ├── FieldSignal.css
│       └── DrilldownPanel.css

================================================================================
IMPLEMENTED MODULES (PHASE 1)
================================================================================

✅ MISSION BRIEF
   - 5 KPI tiles (Conversations, Conversions, Conv Rate, Sentiment, Risk)
   - Tile configuration (show/hide)
   - Quick action buttons
   - All filters applied

✅ FIELD SIGNAL
   - Daily conversation pulse (line chart with dual axes)
   - Issue spike detector (horizontal bar chart)
   - Severity distribution (pie chart)
   - Issues table with click drill-down
   - Regional hotspots table

⏳ FIELD INTEL (Coming soon)
   - Entity demand tracking
   - Competitor intelligence
   - Entity-issue matrix

⏳ FIELD OPS
   - Agent performance table (backend API ready)
   - Team comparison table (backend API ready)
   - Quality metrics (backend API ready)

⏳ FIELD STRATEGY
   - Outcome distribution (backend API ready)
   - Risk by region (backend API ready)
   - Impact analysis (backend API ready)

⏳ FIELD HQ
   - Data quality metrics (backend API ready)
   - Coverage analysis (backend API ready)

================================================================================
DESIGN SYSTEM
================================================================================

COLORS:
  Primary:      #0A1F44 (Deep Navy)
  Command Blue: #1C3F7C (Headers, Active)
  Light Gray:   #F2F4F7 (Backgrounds)
  Soft Steel:   #D9E2EC (Borders)
  Success:      #2ECC71 (Green)
  Warning:      #E67E22 (Orange/Spike)
  Risk:         #E74C3C (Red)
  Interactive:  #3498DB (Blue)

TYPOGRAPHY:
  Font:         Inter, system fonts
  Headers:      18-28px, weight 600
  Body:         14-16px, weight 400-500

SPACING:
  xs: 4px    |  sm: 8px   |  md: 16px  |  lg: 24px  |  xl: 32px

RADIUS:        8px (all rounded elements)
SHADOWS:       Subtle 1px to 16px shadows

================================================================================
GLOBAL FILTER STATE MANAGEMENT
================================================================================

Filters in Context:
{
  time_range: '7' | '30' | '90' | '365',
  region_id: number | null,
  team_id: number | null,
  channel_id: number | null,
  client_type_id: number | null,
}

How it works:
1. Global filters update context
2. All child components receive filters
3. API calls include filter params
4. Drilldown preserves filter state

Example:
  /api/field-signal/pulse?time_range=30&region_id=1&team_id=2

================================================================================
API ENDPOINTS (READY)
================================================================================

SYSTEM:
  GET /api/health                       → Database status
  GET /api/filters/dimensions           → All filter options

MISSION BRIEF:
  GET /api/mission-brief/tiles          → KPI values

FIELD SIGNAL:
  GET /api/field-signal/pulse           → Daily conversation trend
  GET /api/field-signal/issues          → Top issues
  GET /api/field-signal/severity-distribution → Severity breakdown
  GET /api/field-signal/hotspots        → Regional hotspots

FIELD OPS:
  GET /api/field-ops/agents             → Agent performance
  GET /api/field-ops/teams              → Team performance

FIELD STRATEGY:
  GET /api/field-strategy/outcomes      → Outcome distribution
  GET /api/field-strategy/risk-by-region → Regional risk

FIELD HQ:
  GET /api/field-hq/data-quality        → Quality metrics

================================================================================
DRILL-DOWN INTERACTION (DDIM)
================================================================================

Current Implementation:
- Issue name in table → Opens drill-down panel with issue details
- Panel shows: issue_id, issue_name, volume, sentiment, severity, conversions
- Filters applied are shown in drill-down context
- Close button returns to main view

Extensible:
- Add onDrilldown callback to any table row
- Pass (type, id, context) to parent
- Parent renders DrilldownPanel
- Filter state preserved automatically

Example:
  <tr onClick={() => onDrilldown('issue', issue.issue_id, issue)}>

================================================================================
CUSTOMIZATION GUIDE
================================================================================

1. ADD NEW FILTER
   
   a) Add to backend.py parse_filters()
   b) Add to get_filter_dimensions() API endpoint
   c) Create new filter input in GlobalFilters.jsx or ContextualFilters.jsx
   d) Update filter state shape in App.jsx

2. ADD NEW VISUALIZATION
   
   a) Create API endpoint in backend.py
   b) Create React component in pages/
   c) Fetch data with filters
   d) Render with Plotly
   e) Add navigation link in Navigation.jsx

3. CHANGE COLORS
   
   - Edit :root variables in App.css
   - All components inherit from CSS custom properties
   - No inline styles needed

4. CUSTOMIZE DESIGN
   
   - Edit responsive breakpoints in media queries (768px, 1024px)
   - Adjust spacing, radius, shadows
   - All design tokens in App.css

================================================================================
DEPLOYMENT
================================================================================

DEVELOPMENT:
  Terminal 1: python backend.py
  Terminal 2: npm start
  Access:    http://localhost:3000

PRODUCTION (Node + Flask):
  1. Build React:
     npm run build
  
  2. Serve static files from Flask:
     app.static_folder = 'build'
     app.static_url_path = '/'
  
  3. Run with Gunicorn:
     gunicorn -w 4 -b 0.0.0.0:5000 backend:app
  
  4. Access on port 5000

DOCKER (Optional):
  Create Dockerfile:
    FROM python:3.9
    FROM node:16
    [Install, build React, copy to Flask static]
    CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "backend:app"]

================================================================================
TROUBLESHOOTING
================================================================================

ISSUE: "Cannot GET /" on localhost:3000
  FIX: Ensure npm start is running
       Check package.json proxy setting points to localhost:5000

ISSUE: API calls fail (404)
  FIX: Verify Flask backend running on port 5000
       Check database path in backend.py
       Verify filters being sent in request URL

ISSUE: Charts not rendering
  FIX: Open browser console (F12)
       Check for Plotly.js errors
       Verify API response has data field

ISSUE: Filters not updating charts
  FIX: Check FilterContext.Provider wrapping App
       Verify filters passed to API calls
       Check React DevTools for filter state

ISSUE: Slow performance
  FIX: Reduce date range (use 7 days instead of 365)
       Add database indexes on fact_conversation columns
       Enable lazy loading for charts

================================================================================
NEXT STEPS (PHASE 2)
================================================================================

IMMEDIATE:
  □ Complete Field Intel module (entity/competitor intelligence)
  □ Complete Field Strategy module (outcomes, risk, impact)
  □ Complete Field HQ module (admin, governance)
  □ Add geographic map visualization

FEATURES:
  □ Export visualizations to PNG/PDF
  □ Drill-down to agent detail page
  □ Comparison period-over-period
  □ Custom date range picker
  □ Saved filter presets
  □ Dark mode toggle

PERFORMANCE:
  □ API response caching (Redis)
  □ Lazy load chart components
  □ Virtual scrolling for large tables
  □ Database query optimization

ADVANCED:
  □ Anomaly detection (spikes)
  □ Forecasting (trends)
  □ User authentication
  □ Role-based access control
  □ Audit logging

================================================================================
SUPPORT
================================================================================

Debugging:
  1. Browser console (F12) for frontend errors
  2. Flask logs for backend errors
  3. Network tab to inspect API calls
  4. React DevTools to inspect component state

Questions?
  - Review code comments in each file
  - Check API endpoint definitions in backend.py
  - Inspect component props in React DevTools

================================================================================
CHECKLIST BEFORE HANDOVER
================================================================================

□ Backend running on :5000
□ Frontend running on :3000
□ All 6 module tabs visible
□ Global filters working (time, region, team)
□ Contextual filters in sidebar (channel, client type)
□ Mission Brief shows 5 KPI tiles
□ Field Signal shows pulse chart, issues, severity
□ Click issue name opens drill-down panel
□ Filters update visualizations when changed
□ No console errors in browser
□ Database path correct in backend.py
□ All API endpoints return valid JSON

================================================================================
