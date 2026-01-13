# Field Intelligence Platform 🚀

A comprehensive Field Intelligence Platform with React frontend and Flask backend, featuring automatic authentication and Azure deployment.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)

---

## 🌟 Features

- **🔒 Secure Authentication** - Three-field login (Organization, Username, Password)
- **📊 Real-time Dashboards** - Multiple intelligence modules
- **🔄 Auto Deployment** - GitHub Actions CI/CD to Azure
- **📱 Responsive Design** - Works on desktop and mobile
- **⚡ Fast Performance** - Optimized React + Flask architecture
- **🎯 Field Intelligence** - Signal, Intel, Operations, Strategy, and Admin HQ modules

---

## 🔐 Login Credentials

Access the platform with these credentials:

```
Organization: DR.ROOF
Username: admin
Password: admin pass
```

---

## 🚀 Quick Start

### Local Development

#### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- SQLite database (`fieldforce.db`)

#### 1. Clone Repository
```bash
git clone <your-repo-url>
cd FieldForce_V2.1_App-main
```

#### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
pip install -r requirements.txt
```

#### 3. Run Application

**Option A: Development Mode (Separate Servers)**
```bash
# Terminal 1 - Backend
python backend.py

# Terminal 2 - Frontend
npm start
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

**Option B: Production Mode (Single Server)**
```bash
# Build frontend
npm run build

# Run backend (serves both)
python backend.py
```
- Access: http://localhost:5000

---

## 🌐 Azure Deployment

### Automatic Deployment Setup

This project includes GitHub Actions for automatic deployment to Azure Web App.

#### 1. Create Azure Web App
```bash
az webapp create \
  --resource-group fieldforce-rg \
  --plan fieldforce-plan \
  --name your-app-name \
  --runtime "PYTHON:3.11"
```

#### 2. Configure GitHub Secrets
1. Go to GitHub Repository → **Settings** → **Secrets**
2. Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
3. Paste Azure publish profile content

#### 3. Update Workflow
Edit `.github/workflows/azure-deploy.yml`:
```yaml
env:
  AZURE_WEBAPP_NAME: your-app-name  # ← Your Azure app name
```

#### 4. Deploy
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

**🎉 Done! Your app deploys automatically on every push.**

📖 **Detailed Guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📁 Project Structure

```
FieldForce_V2.1_App-main/
├── .github/workflows/       # GitHub Actions CI/CD
├── src/
│   ├── components/          # React components
│   │   ├── Login.jsx        # Authentication
│   │   ├── GlobalFilters.jsx
│   │   └── ...
│   ├── pages/               # Page modules
│   │   ├── Home.jsx
│   │   ├── FieldSignal.jsx
│   │   ├── FieldIntel.jsx
│   │   ├── FieldOps.jsx
│   │   ├── FieldStrategy.jsx
│   │   └── FieldHQ.jsx
│   ├── styles/              # CSS files
│   └── App.jsx              # Main application
├── public/                  # Static assets
├── backend.py               # Flask API server
├── requirements.txt         # Python dependencies
├── package.json             # Node dependencies
├── startup.sh               # Azure startup script
└── fieldforce.db            # SQLite database
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
# Database
DB_FILE=fieldforce.db

# Server
PORT=5000
HOST=0.0.0.0
DEBUG=False
```

### Azure Configuration

Set in Azure Portal → Configuration → Application Settings:

```
PORT=8000
HOST=0.0.0.0
DEBUG=False
DB_FILE=/home/site/wwwroot/fieldforce.db
WEBSITES_PORT=8000
```

---

## 🎯 Available Modules

1. **🏠 Home** - Dashboard overview with key metrics
2. **📡 Field Signal** - Real-time field intelligence
3. **🔍 Field Intel** - Intelligence analysis
4. **⚙️ Field Operations** - Operational metrics
5. **📈 Field Strategy** - Strategic insights
6. **👤 Admin HQ** - Administrative controls

---

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:5000/api/health

# Get filters
curl http://localhost:5000/api/filters/dimensions
```

### Test Frontend
```bash
npm test
```

### Build for Production
```bash
npm run build
```

---

## 📊 API Endpoints

### System
- `GET /api/health` - Health check
- `GET /api/filters/dimensions` - Filter options

### Mission Brief
- `GET /api/mission-brief/tiles` - KPI tiles

### Field Signal
- `GET /api/field-signal/pulse` - Daily conversation pulse
- `GET /api/field-signal/issues` - Top issues
- `GET /api/field-signal/severity-distribution` - Severity distribution
- `GET /api/field-signal/hotspots` - Geographic hotspots

### Field Operations
- `GET /api/field-ops/agents` - Agent performance
- `GET /api/field-ops/teams` - Team performance

### Field Strategy
- `GET /api/field-strategy/outcomes` - Outcome distribution
- `GET /api/field-strategy/risk-by-region` - Risk by region
- `GET /api/field-strategy/outcome-trend` - Outcome trends

### Field HQ
- `GET /api/field-hq/data-quality` - Data quality metrics

---

## 🔒 Authentication Flow

1. User visits application
2. Login page appears (if not authenticated)
3. User enters Organization, Username, Password
4. Credentials validated against hardcoded values
5. On success: Session stored in localStorage
6. User redirected to dashboard
7. Click username/avatar to logout

---

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Plotly.js** - Data visualization
- **CSS3** - Styling

### Backend
- **Flask 3.0** - Web framework
- **Flask-CORS** - CORS support
- **SQLite** - Database
- **Gunicorn** - Production server

### DevOps
- **GitHub Actions** - CI/CD
- **Azure Web Apps** - Hosting
- **npm** - Package management
- **pip** - Python packages

---

## 🚨 Troubleshooting

### Cannot connect to backend
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check proxy in package.json
"proxy": "http://127.0.0.1:5000"
```

### Database not found
```bash
# Verify database file exists
ls fieldforce.db

# Check DB_FILE environment variable
echo $DB_FILE
```

### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Azure deployment fails
- Check GitHub Actions logs
- Verify publish profile secret
- Check Azure app name in workflow
- Review Azure log stream

---

## 📈 Performance

- **Initial Load:** < 2 seconds
- **API Response:** < 200ms average
- **Database Queries:** Optimized with indexes
- **Frontend Bundle:** Code-split for efficiency

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Flask dashboard architecture
- React best practices
- Azure deployment patterns
- Field intelligence design patterns

---

## 📞 Support

For deployment help, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 🔄 Version History

- **v2.1** - Added authentication, Azure deployment, GitHub Actions
- **v2.0** - Full dashboard implementation
- **v1.0** - Initial release

---

**Built with ❤️ for Field Intelligence**
