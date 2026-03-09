# 🚀 SpecPoints - Quick Start Guide

Get SpecPoints SaaS running in minutes - locally or on Railway.

---

## ⚡ Quick Deploy to Railway (5 minutes)

### Prerequisites
- Railway account (free tier available)
- GitHub repo connected to Railway
- This project pushed to GitHub

### Steps

1. **Create Railway Project**
   ```
   Go to railway.app → "New Project" → "Deploy from GitHub"
   Select this repository
   ```

2. **Add PostgreSQL Service**
   ```
   Click "Add Service" → Select "PostgreSQL"
   Railway creates database automatically
   Copy the DATABASE_URL from service variables
   ```

3. **Configure API Service** (`spec-points-api`)
   ```
   Required Environment Variables:
   - DATABASE_URL        (from PostgreSQL service)
   - FIREBASE_PROJECT_ID = spec-points-prod
   - FIREBASE_PRIVATE_KEY = (get from Firebase console)
   - FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@spec-points-prod.iam.gserviceaccount.com
   - JWT_SECRET = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
   - CORS_ORIGIN = https://spec-points-web.railway.app (set after web deploys)
   ```

4. **Configure Web Service** (`spec-points-web`)
   ```
   Required Environment Variables:
   - VITE_API_URL = https://spec-points-api.railway.app/api
   - VITE_FIREBASE_API_KEY = AIzaSyCBf0Po55DuN2LM0c6IsPsoOmaVUmf6Z98
   - VITE_FIREBASE_AUTH_DOMAIN = spec-points-prod.firebaseapp.com
   - VITE_FIREBASE_PROJECT_ID = spec-points-prod
   - VITE_FIREBASE_STORAGE_BUCKET = spec-points-prod.firebasestorage.app
   - VITE_FIREBASE_MESSAGING_SENDER_ID = 1034624051135
   - VITE_FIREBASE_APP_ID = 1:1034624051135:web:d6da31c805a5350efb230a
   ```

5. **Deploy** (automatic on GitHub push)
   ```
   Both services deploy automatically from their Dockerfiles
   Check Deployments tab for status
   ```

6. **Verify**
   ```
   API Health: curl https://spec-points-api.railway.app/health
   Web: Visit https://spec-points-web.railway.app
   ```

---

## 💻 Quick Local Development (10 minutes)

### Option A: Using Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL + API + Web)
docker-compose up

# Access:
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:3000
# - Database: localhost:5432 (postgres/postgres)

# Stop services
docker-compose down
```

### Option B: Manual Setup

```bash
# Terminal 1: Backend API
cd spec-points-api
npm install
cp .env.example .env
# Update DATABASE_URL to local PostgreSQL if needed
npm run migrate  # Setup database
npm run dev     # Starts on http://localhost:3000

# Terminal 2: Frontend
cd spec-points-web
npm install
npm run dev     # Starts on http://localhost:5173

# Visit http://localhost:5173
# Login with Firebase test account
```

---

## 🧪 Test the Application

### After Deployment/Local Setup

1. **Open Web App**
   - Production: https://spec-points-web.railway.app
   - Local: http://localhost:5173

2. **Login with Firebase Account**
   - Use any Google account with Firebase enabled
   - First-time users need admin approval (or use existing admin account)

3. **Navigate Main Features**
   - Dashboard: See aggregated statistics
   - `/architects` - Manage architect profiles
   - `/stores` - Manage store locations
   - `/sales` - Record transactions (auto-calculates points)
   - `/prizes` - Manage reward catalog
   - `/redemptions` - Track reward redemptions

4. **Mobile Test**
   - Resize browser to mobile width (375px)
   - Check drawer navigation (hamburger menu)
   - Verify button touch targets (44px minimum)
   - Test form layouts on small screens

---

## 📊 API Endpoints (Quick Reference)

```bash
# All requests need Authorization header
Authorization: Bearer <JWT_TOKEN>

# Get all architects
curl -H "Authorization: Bearer TOKEN" \
  https://spec-points-api.railway.app/api/architects

# Create a sale
curl -X POST https://spec-points-api.railway.app/api/sales \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "architect_id": 1,
    "store_id": 1,
    "client_name": "Client Name",
    "amount_usd": 100,
    "description": "Material sale"
  }'

# All CRUD operations available for:
# - /api/architects
# - /api/stores
# - /api/sales
# - /api/prizes
# - /api/redemptions
```

---

## 🔑 Key Environment Variables

### Backend (spec-points-api/.env)
```
NODE_ENV=production
API_PORT=3000
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=spec-points-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
JWT_SECRET=...
CORS_ORIGIN=https://... (or http://localhost:5173 local)
```

### Frontend (spec-points-web/.env.local)
```
VITE_API_URL=https://...api (or http://localhost:3000 local)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 🐛 Troubleshooting

### "Cannot connect to API" Error
- **Local**: Ensure `npm run dev` running in `spec-points-api` folder
- **Production**: Check CORS_ORIGIN matches frontend URL
- **Test**: `curl https://spec-points-api.railway.app/health`

### "Firebase login not working"
- Verify Firebase credentials in `.env` or environment variables
- Check Firebase project has Web SDK enabled
- Verify redirect URI includes deployment domain

### "Database connection failed"
- **Local**: Ensure PostgreSQL running and DATABASE_URL correct
- **Production**: Check Railway PostgreSQL service is running
- **Test**: `psql $DATABASE_URL -c "SELECT version();"`

### "Build fails on Railway"
- Check all environment variables are set (Railway dashboard)
- Ensure Node.js 20+ available
- Review build logs in Railway Deployments tab
- Clear cache: Delete deployment and redeploy

---

## 📚 Full Documentation

- **Detailed Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project Overview**: See [README.md](./README.md)
- **Backend Setup**: See [spec-points-api/README.md](./spec-points-api/README.md)
- **Frontend Setup**: See [spec-points-web/README.md](./spec-points-web/README.md)

---

## ✅ Deployment Checklist

- [ ] Clone repository to GitHub
- [ ] Create Railway account
- [ ] Create Railway project from GitHub
- [ ] Add PostgreSQL service
- [ ] Set all backend environment variables
- [ ] Set all frontend environment variables
- [ ] Verify both services deploy successfully
- [ ] Test Firebase login flow
- [ ] Test all CRUD operations
- [ ] Test on mobile browser
- [ ] Enable auto-deploy on GitHub push

---

## 🎯 Next Steps

1. **Local Development**
   - Run `docker-compose up` for full stack
   - Make code changes, auto-reload on save
   - Test all features locally before pushing

2. **Deploy Changes**
   - Push to GitHub `main` branch
   - Railway auto-deploys within 2-5 minutes
   - Verify deployment in Railway dashboard

3. **Add Custom Domain** (Optional)
   - Go to Railway project settings
   - Add custom domain (e.g., specpoints.com)
   - Configure DNS records
   - Enable SSL certificate

4. **Production Monitoring** (Optional)
   - Enable Railway metrics
   - Set up error alerting
   - Monitor database performance
   - Review audit logs regularly

---

**Status**: Production Ready ✅  
**Duration to Deploy**: ~10 minutes  
**Duration for Local Setup**: ~5 minutes (with docker-compose)
