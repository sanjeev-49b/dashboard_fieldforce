# 🚀 Quick Start Guide - GitHub Actions + Azure Deployment

## ⚡ 5-Minute Setup

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit with authentication and Azure deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Create Azure Web App
```bash
# Option A: Using Azure CLI (fastest)
az login
az webapp create \
  --resource-group fieldforce-rg \
  --plan fieldforce-plan \
  --name your-unique-app-name \
  --runtime "PYTHON:3.11"

# Option B: Use Azure Portal
# Go to portal.azure.com → Create Resource → Web App
```

### Step 3: Get Publish Profile
1. Azure Portal → Your Web App
2. Click **"Get publish profile"** (top toolbar)
3. Copy ALL the content from the downloaded file

### Step 4: Add GitHub Secret
1. GitHub Repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the publish profile content
5. Click **"Add secret"**

### Step 5: Configure Workflow
Edit `.github/workflows/azure-deploy.yml`:
```yaml
env:
  AZURE_WEBAPP_NAME: your-unique-app-name    # ← Change this!
```

### Step 6: Configure Azure App
In Azure Portal → Your Web App → Configuration:

**Application Settings:**
```
PORT = 8000
HOST = 0.0.0.0
DEBUG = False
DB_FILE = /home/site/wwwroot/fieldforce.db
WEBSITES_PORT = 8000
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

**Startup Command (General settings tab):**
```bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers=4 backend:app
```

Click **Save** after each change!

### Step 7: Upload Database
**Using Kudu (easiest):**
1. Azure Portal → Your Web App → **Advanced Tools**
2. Click **"Go"** → Opens Kudu
3. Click **"Debug console"** → **"CMD"**
4. Navigate to `/home/site/wwwroot/`
5. Drag and drop your `fieldforce.db` file

### Step 8: Deploy!
```bash
git add .
git commit -m "Configure for Azure deployment"
git push origin main
```

**That's it!** 🎉

Watch the deployment:
- GitHub: **Actions** tab
- Azure: **Deployment Center** → **Logs**

Access your app:
```
https://your-unique-app-name.azurewebsites.net
```

---

## 🔐 Login Details

```
Organization: DR.ROOF
Username: admin
Password: admin pass
```

---

## ✅ Checklist

Before deployment:
- [ ] Code pushed to GitHub
- [ ] Azure Web App created
- [ ] Publish profile added to GitHub secrets
- [ ] App name updated in workflow file
- [ ] Azure environment variables configured
- [ ] Startup command set
- [ ] Database uploaded to Azure

After deployment:
- [ ] GitHub Actions workflow completed successfully
- [ ] App loads at Azure URL
- [ ] Login works
- [ ] All pages accessible
- [ ] API endpoints working

---

## 🆘 Common Issues

### "Cannot find module 'backend'"
**Fix:** Check startup command in Azure Configuration

### "Database not found"
**Fix:** 
1. Upload database via Kudu
2. Set `DB_FILE` in Azure app settings

### "502 Bad Gateway"
**Fix:** 
1. Check Azure logs (Log stream)
2. Verify Python version is 3.11
3. Ensure startup command is correct

### GitHub Actions fails
**Fix:**
1. Verify publish profile secret
2. Check app name in workflow
3. Review Actions log for specific error

---

## 📊 Monitor Your App

### View Logs
```bash
# Real-time logs
az webapp log tail --name your-app-name --resource-group fieldforce-rg

# Or use Azure Portal:
# Your Web App → Monitoring → Log stream
```

### Check Health
```bash
curl https://your-app-name.azurewebsites.net/api/health
```

---

## 🔄 Update Your App

Just push changes:
```bash
git add .
git commit -m "Updated feature"
git push origin main
```

GitHub Actions automatically:
1. Builds React app
2. Packages everything
3. Deploys to Azure
4. Restarts the service

**No manual intervention needed!** ✨

---

## 📱 Test Locally First

```bash
# Build production version
npm run build

# Test with Python
python backend.py

# Open: http://localhost:5000
```

---

## 🎯 Next Steps

1. **Custom Domain:** Add your own domain in Azure
2. **SSL Certificate:** Azure provides free SSL
3. **Monitoring:** Enable Application Insights
4. **Scaling:** Configure auto-scaling rules
5. **Backup:** Set up automated backups
6. **Security:** Change default credentials

---

**Need detailed help?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Questions?** Check [README.md](README.md)

---

**Happy Deploying! 🚀**





