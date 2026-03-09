# SpecPoints SaaS - Railway Deployment Guide

## Overview

This monorepo contains two services:
- **spec-points-api**: Express.js backend API (Node.js on port 3000)
- **spec-points-web**: React frontend (Nginx on port 8080)

Both services are configured for containerized deployment on Railway.

## Prerequisites

- A Railway account (https://railway.app)
- GitHub repository with this project pushed
- PostgreSQL database (Railway provides managed PostgreSQL)
- Firebase project with Admin SDK credentials

## Setup Instructions

### 1. Create Railway Project

1. Go to https://railway.app and sign in
2. Click "Create New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select the SpecPoints repository
5. Railway will auto-detect the monorepo structure

### 2. Configure Database

1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will create a PostgreSQL instance
4. Copy the `DATABASE_URL` connection string

### 3. Deploy API Service

#### Environment Variables (required)
Set these in Railway dashboard under the `spec-points-api` service:

**Required Secrets:**
- `DATABASE_URL` - PostgreSQL connection URL (from Railway PostgreSQL service)
- `FIREBASE_PROJECT_ID` - From Firebase console (e.g., "spec-points-prod")
- `FIREBASE_PRIVATE_KEY` - From Firebase Admin SDK JSON (the entire key including newlines)
- `FIREBASE_CLIENT_EMAIL` - From Firebase Admin SDK JSON
- `JWT_SECRET` - A secure random string (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- `CORS_ORIGIN` - Your frontend URL (e.g., "https://spec-points-web.railway.app")

**Optional Configuration:**
- `NODE_ENV` - Set to "production" (default: "production")
- `API_PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: "info")
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 900000)
- `RATE_LIMIT_MAX_ATTEMPTS` - Max requests per window (default: 5)

#### Deployment Steps

1. Railway will automatically build and deploy from the Dockerfile
2. Wait for deployment to complete
3. Copy the API service URL (e.g., `https://spec-points-api.railway.app`)
4. Test API health: `curl https://spec-points-api.railway.app/health`

### 4. Deploy Web Service

#### Environment Variables (required)
Set these in Railway dashboard under the `spec-points-web` service:

**Required Variables:**
- `VITE_API_URL` - Backend API URL (e.g., "https://spec-points-api.railway.app/api")
- `VITE_FIREBASE_API_KEY` - From Firebase console
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (e.g., "spec-points-prod.firebaseapp.com")
- `VITE_FIREBASE_PROJECT_ID` - Same as backend (e.g., "spec-points-prod")
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

#### Deployment Steps

1. Railway will automatically build from the Dockerfile
2. The Dockerfile runs `npm run build` and serves with Nginx on port 8080
3. Wait for deployment to complete
4. Test web service: Visit `https://spec-points-web.railway.app`

### 5. Verify Deployment

#### Check API Connectivity

```bash
# Health check
curl https://spec-points-api.railway.app/health

# Database connection test
curl https://spec-points-api.railway.app/api/architects
# (Should return 401 Unauthorized if auth is working, not 500 error)
```

#### Check Web Connectivity

```bash
# Visit in browser
https://spec-points-web.railway.app

# Should load React app, redirect to login if not authenticated
```

#### Test Full Auth Flow

1. Visit https://spec-points-web.railway.app
2. Login with a Firebase account
3. Navigate through the app:
   - ✅ Dashboard loads
   - ✅ Can view /architects page
   - ✅ Can view /stores page
   - ✅ Can view /sales page
   - ✅ Can view /prizes page
   - ✅ Can view /redemptions page
4. Mobile responsive check:
   - Resize browser to mobile width (375px)
   - Check drawer navigation opens/closes
   - Check button touch targets (44px minimum)
   - Check form layouts stack properly

### 6. Database Migrations

After deploying, run initial migrations to set up schema:

```bash
# Option 1: Via Railway CLI
railway run npm run migrate

# Option 2: Manually in PostgreSQL
# Connect to database and run schema setup
```

**Note**: The `migrate.ts` script should create all required tables:
- users
- architects
- stores
- sales
- prizes
- redemptions
- login_attempts
- security_audit_log

### 7. Enable Auto-Deploy

Railway auto-deploys on every push to main/master branch by default.

To configure specific branch:
1. Go to Railway project settings
2. Under "Deploy", select your branch (e.g., "main")
3. Save changes

## Troubleshooting

### API Service Won't Start

**Error: Database connection failed**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running in Railway
- Check network access rules

**Error: Firebase initialization failed**
- Verify `FIREBASE_PRIVATE_KEY` includes newlines correctly
- Verify `FIREBASE_PROJECT_ID` matches
- Verify `FIREBASE_CLIENT_EMAIL` is correct

### Web Service Shows Blank Page

**Error: API calls fail with CORS error**
- Verify `VITE_API_URL` is set correctly in frontend env vars
- Check backend `CORS_ORIGIN` matches frontend URL
- Check API service is accessible (test with curl)

**Error: Firebase authentication not working**
- Verify all `VITE_FIREBASE_*` variables are set
- Check Firebase project has Web auth enabled
- Verify redirect URI in Firebase console includes Railway URL

### Builds Keep Failing

**Check logs:**
```bash
# Via Railway CLI
railway logs --service spec-points-api
railway logs --service spec-points-web
```

**Common issues:**
- Missing environment variables (check Railway dashboard)
- Out of memory (Railway free tier has limits)
- Timeout during build (increase build timeout in Railway settings)

## Performance Optimization

### API Service

- Enable caching headers for static assets
- Consider connection pooling for database
- Monitor rate limiting effectiveness

### Web Service

- Nginx gzip compression enabled (configured in nginx.conf)
- Browser caching headers configured
- PWA manifest and service workers enabled

## Security Checklist

- [ ] `JWT_SECRET` is a strong random string
- [ ] `FIREBASE_PRIVATE_KEY` is stored securely (Railway secrets)
- [ ] `CORS_ORIGIN` is set to production domain only
- [ ] Rate limiting enabled on API
- [ ] HTTPS enforced (Railway provides SSL by default)
- [ ] Database user has minimal required permissions
- [ ] Firebase rules restrict data access properly

## Monitoring

### Railway Dashboard

- Check metrics tab for CPU, memory, disk usage
- Monitor build/deploy logs for errors
- Set up alerts for service failures

### Recommended Additions

Consider adding:
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Log aggregation (LogDNA)
- Uptime monitoring (UptimeRobot)

## Maintenance

### Reset Database

If you need to reset the database:

```sql
-- Drop all tables (destructive!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;

-- Re-run migrations
npm run migrate
```

### Update Environment Variables

1. Go to Railway service settings
2. Click "Variables"
3. Update required variables
4. Service will auto-restart with new variables

### Redeploy Specific Service

```bash
# Via Railway CLI
railway deploy --service spec-points-api
railway deploy --service spec-points-web
```

## Local Development vs Production

### Key Differences

| Aspect | Local | Production |
|--------|-------|-----------|
| Database | Local PostgreSQL | Railway PostgreSQL |
| API URL | http://localhost:3000 | https://spec-points-api.railway.app |
| Web URL | http://localhost:5173 | https://spec-points-web.railway.app |
| CORS Origin | http://localhost:5173 | https://spec-points-web.railway.app |
| Firebase | Test/Dev project | Production project |
| Logs | Console | Railway dashboard |
| Rate Limiting | Disabled | Enabled |

### Switching Environments

**To test production builds locally:**

```bash
# Build API
cd spec-points-api
npm run build
NODE_ENV=production npm start

# Build Web
cd spec-points-web
npm run build
npm run preview
```

## Support & Next Steps

### Common Questions

**Q: How do I roll back to a previous version?**
A: Railway stores build history. Click the deployment and select "Redeploy" from previous builds.

**Q: How can I access the database?**
A: Use Railway's built-in database GUI or connect with psql:
```bash
railway connect --service postgresql
```

**Q: What's the uptime SLA?**
A: Railway doesn't guarantee SLA on free tier. Use paid plans for production apps.

### Next Improvements

- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement comprehensive logging/monitoring
- [ ] Set up CI/CD testing before deploy
- [ ] Add backup strategy for database
- [ ] Configure custom domain instead of railway.app
- [ ] Implement API versioning strategy

## Quick Reference

### Service URLs
- **API**: `https://spec-points-api.railway.app`
- **Web**: `https://spec-points-web.railway.app`

### Key Files
- Railway config: `railway.toml`
- API Dockerfile: `spec-points-api/Dockerfile`
- Web Dockerfile: `spec-points-web/Dockerfile`
- Nginx config: `spec-points-web/nginx.conf`

### Important Env Vars
```
# API CRITICAL
DATABASE_URL=postgresql://...
FIREBASE_PRIVATE_KEY=...
JWT_SECRET=...
CORS_ORIGIN=https://...

# Web CRITICAL
VITE_API_URL=https://...api
VITE_FIREBASE_API_KEY=...
```

---
**Last Updated**: 2026-03-09
**Status**: Ready for Railway deployment
