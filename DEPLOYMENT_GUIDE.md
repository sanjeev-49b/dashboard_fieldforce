# Field Intelligence Platform - Azure Deployment Guide

## 🚀 Automatic Deployment with GitHub Actions

This guide will help you set up automatic deployment to Azure Web App using GitHub Actions.

---

## Prerequisites

1. **Azure Account** with an active subscription
2. **GitHub Account** with repository access
3. **Azure Web App** created (Python 3.11 runtime)
4. **Database file** (`fieldforce.db`) ready

---

## 📋 Step-by-Step Setup

### 1. Create Azure Web App

```bash
# Login to Azure
az login

# Create resource group
az group create --name fieldforce-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name fieldforce-plan \
  --resource-group fieldforce-rg \
  --sku B1 \
  --is-linux

# Create Web App (Python 3.11)
az webapp create \
  --resource-group fieldforce-rg \
  --plan fieldforce-plan \
  --name your-app-name \
  --runtime "PYTHON:3.11"
```

**Or use Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new **Web App**
3. Choose **Python 3.11** runtime
4. Select **Linux** OS
5. Choose pricing tier (B1 or higher recommended)

---

### 2. Configure Azure Web App

#### Set Environment Variables in Azure Portal:

```bash
# Via Azure CLI
az webapp config appsettings set \
  --resource-group fieldforce-rg \
  --name your-app-name \
  --settings \
    PORT=8000 \
    HOST=0.0.0.0 \
    DEBUG=False \
    DB_FILE=/home/site/wwwroot/fieldforce.db \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    WEBSITES_PORT=8000
```

**Or in Azure Portal:**
1. Go to your Web App
2. Settings → **Configuration**
3. Add **Application Settings**:
   - `PORT` = `8000`
   - `HOST` = `0.0.0.0`
   - `DEBUG` = `False`
   - `DB_FILE` = `/home/site/wwwroot/fieldforce.db`
   - `WEBSITES_PORT` = `8000`
4. Click **Save**

#### Set Startup Command:

In Azure Portal:
1. Go to **Configuration** → **General settings**
2. Set **Startup Command**:
   ```bash
   gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers=4 backend:app
   ```
3. Click **Save**

---

### 3. Get Azure Publish Profile

1. Go to your **Web App** in Azure Portal
2. Click **Get publish profile** (top menu)
3. Download the `.publishsettings` file
4. Open it and copy ALL the content

---

### 4. Configure GitHub Repository

#### Add GitHub Secret:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the entire content from the publish profile file
6. Click **Add secret**

#### Update Workflow File:

Edit `.github/workflows/azure-deploy.yml`:

```yaml
env:
  AZURE_WEBAPP_NAME: your-app-name    # ← Change this to your actual Azure Web App name
```

---

### 5. Upload Database (First Time Only)

#### Option A: Via Azure Portal
1. Go to your Web App → **Development Tools** → **Advanced Tools (Kudu)**
2. Click **Go** → Opens Kudu console
3. Navigate to **Debug console** → **CMD**
4. Go to `/home/site/wwwroot/`
5. Drag and drop `fieldforce.db` file

#### Option B: Via Azure CLI
```bash
az webapp deployment source config-zip \
  --resource-group fieldforce-rg \
  --name your-app-name \
  --src fieldforce.db.zip
```

#### Option C: Via FTP
1. Azure Portal → Your Web App → **Deployment Center**
2. Get **FTP credentials**
3. Use FileZilla or similar FTP client
4. Upload `fieldforce.db` to `/site/wwwroot/`

---

### 6. Deploy Your Code

Now every time you push to `main` or `master` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Build React frontend
2. ✅ Install Python dependencies
3. ✅ Create deployment package
4. ✅ Deploy to Azure
5. ✅ App goes live!

**Monitor deployment:**
- GitHub: **Actions** tab
- Azure Portal: **Deployment Center** → **Logs**

---

## 🔒 Authentication Details

The app has built-in authentication with these credentials:

- **Organization:** `DR.ROOF`
- **Username:** `admin`
- **Password:** `admin pass`

Users must enter all three fields correctly to access the platform.

---

## 📁 Project Structure

```
FieldForce_V2.1_App-main/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml      # GitHub Actions workflow
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.jsx             # Authentication component
│   │   ├── GlobalFilters.jsx
│   │   └── ...
│   ├── pages/
│   ├── styles/
│   │   ├── Login.css
│   │   └── ...
│   ├── App.jsx                   # Main app with auth logic
│   └── index.js
├── backend.py                    # Flask backend (Azure-ready)
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
├── startup.sh                    # Azure startup script
├── web.config                    # IIS configuration
├── .deployment                   # Azure deployment config
├── .env.example                  # Environment variables template
└── fieldforce.db                 # SQLite database
```

---

## 🧪 Testing Locally

### 1. Test Backend Only:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run Flask server
python backend.py

# Access: http://localhost:5000/api/health
```

### 2. Test Frontend Only:
```bash
# Install Node dependencies
npm install

# Run React dev server
npm start

# Access: http://localhost:3000
```

### 3. Test Full Stack:
```bash
# Terminal 1 - Backend
python backend.py

# Terminal 2 - Frontend
npm start
```

### 4. Test Production Build:
```bash
# Build React app
npm run build

# Serve with Python (simulates Azure)
python backend.py

# Access: http://localhost:5000
```

---

## 🔧 Troubleshooting

### Issue: Deployment fails

**Check:**
1. ✅ Azure Web App name is correct in workflow
2. ✅ Publish profile secret is set correctly
3. ✅ Python version matches (3.11)
4. ✅ All files are committed to Git

### Issue: App shows error after deployment

**Check Azure Logs:**
```bash
# Stream logs
az webapp log tail \
  --resource-group fieldforce-rg \
  --name your-app-name

# Or in Azure Portal:
# Your Web App → Monitoring → Log stream
```

### Issue: Database not found

**Solution:**
```bash
# Set correct DB path in Azure App Settings
DB_FILE=/home/site/wwwroot/fieldforce.db

# Verify database exists in Kudu console
# Navigate to: https://your-app-name.scm.azurewebsites.net
```

### Issue: Login page doesn't appear

**Check:**
1. ✅ React build completed successfully
2. ✅ `build/` folder exists
3. ✅ Backend serves static files correctly
4. ✅ Clear browser cache

### Issue: API calls fail

**Check:**
1. ✅ Backend is running: `/api/health`
2. ✅ CORS is configured correctly
3. ✅ Database connection works
4. ✅ Check Azure logs for errors

---

## 🌐 Access Your Application

Once deployed:
- **Production URL:** `https://your-app-name.azurewebsites.net`
- **Login:** Use DR.ROOF / admin / admin pass
- **Health Check:** `https://your-app-name.azurewebsites.net/api/health`

---

## 📊 Monitoring

### Azure Portal:
1. **Metrics:** CPU, Memory, Response time
2. **Log Stream:** Real-time logs
3. **Alerts:** Set up notifications
4. **Application Insights:** Advanced monitoring (optional)

### GitHub Actions:
1. **Actions Tab:** View deployment history
2. **Build logs:** Debug issues
3. **Deployment status:** Success/Failure badges

---

## 🔄 Update Deployment

To update your app:

```bash
# Make changes to your code
git add .
git commit -m "Updated feature X"
git push origin main
```

That's it! GitHub Actions handles the rest automatically.

---

## 🎯 Best Practices

1. **Always test locally** before pushing
2. **Use environment variables** for configuration
3. **Monitor Azure logs** after deployment
4. **Keep database backups** regularly
5. **Use proper Git branching** strategy
6. **Review deployment logs** in GitHub Actions
7. **Set up alerts** in Azure for downtime

---

## 📞 Support

- **Azure Documentation:** https://docs.microsoft.com/azure
- **GitHub Actions:** https://docs.github.com/actions
- **Flask Documentation:** https://flask.palletsprojects.com/

---

## 🔐 Security Notes

1. **Never commit** `.env` files or secrets to Git
2. **Use Azure Key Vault** for sensitive data in production
3. **Change default credentials** before production use
4. **Enable HTTPS** only in Azure (already configured)
5. **Set up authentication** for admin endpoints
6. **Regular security updates** for dependencies

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Azure Web App created
- [ ] Publish profile added to GitHub secrets
- [ ] Workflow file updated with correct app name
- [ ] Database uploaded to Azure
- [ ] Environment variables configured
- [ ] Startup command set
- [ ] Local testing completed
- [ ] Git repository connected

After deploying:
- [ ] Check deployment status in GitHub Actions
- [ ] Verify app loads at Azure URL
- [ ] Test login functionality
- [ ] Check API endpoints
- [ ] Review Azure logs
- [ ] Test all modules/pages
- [ ] Monitor performance

---

**🎉 You're all set! Your Field Intelligence Platform will now automatically deploy on every push to main/master branch.**

