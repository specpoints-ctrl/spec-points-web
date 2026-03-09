# SpecPoints SaaS - Loyalty Program Platform

## 📱 Project Overview

SpecPoints is a modern B2B SaaS loyalty program platform built for architects and material stores. The platform enables:

- **Arquitetos (Architects)**: Accumulate points on material sales and redeem rewards
- **Lojas (Stores)**: Manage sales, create prize catalogs, and track redemptions  
- **Admins**: Oversee the entire ecosystem with comprehensive management tools

### Key Features

✅ **Authentication**: Firebase + JWT with role-based access control (admin/architect/lojista)
✅ **Complete CRUD Operations**: Manage architects, stores, sales, prizes, and redemptions
✅ **Mobile-First Design**: Fully responsive with 44px touch targets and drawer navigation
✅ **Real-Time Points Calculation**: Automatic point generation from sales (1 USD = 1 point)
✅ **Redemption Workflow**: Multi-status tracking (pending → approved → delivered)
✅ **Dashboard Analytics**: Stats cards for all entities with real-time aggregations
✅ **Production Ready**: Containerized deployment on Railway

---

## 🛠 Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (lightning-fast builds)
- **React Router v6** (navigation)
- **Tailwind CSS** (styling)
- **shadcn/ui** (component library)
- **TanStack React Query** (data fetching)
- **Firebase SDK** (authentication)
- **Axios** (HTTP client)

### Backend
- **Express.js** (Node.js server)
- **TypeScript** (type safety)
- **PostgreSQL** + pg-promise (database)
- **Firebase Admin SDK** (auth validation)
- **Winston** (logging)
- **Helmet** (security)
- **CORS** (cross-origin requests)
- **Rate Limiting** (DDoS protection)

### Database (PostgreSQL)
- `users` - User accounts with Firebase UID
- `architects` - Architect profiles with status
- `stores` - Store partner information
- `sales` - Sales transactions with point calculations
- `prizes` - Reward catalog with stock tracking
- `redemptions` - Redemption requests with workflow status
- `login_attempts` - Rate limiting tracking
- `security_audit_log` - Audit trail

### Deployment
- **Railway** (serverless container hosting)
- **Docker** (containerization for both services)
- **PostgreSQL** (Railway managed database)
- **Nginx** (frontend reverse proxy)
- **SSL/HTTPS** (automatic via Railway)

---

## 📂 Project Structure

```
SpecPoints-saas/
├── spec-points-api/              # Backend Express API
│   ├── src/
│   │   ├── controllers/          # CRUD logic (architects, stores, sales, prizes, redemptions)
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Auth, logging, error handling
│   │   ├── db/                   # Database config and migrations
│   │   ├── types/                # TypeScript interfaces
│   │   ├── index.ts              # Express app initialization
│   │   └── server.ts             # Server entry point
│   ├── Dockerfile                # Multi-stage Node build
│   ├── package.json
│   └── tsconfig.json
│
├── spec-points-web/              # Frontend React SPA
│   ├── src/
│   │   ├── pages/                # Page components (ArchitectsPage, StoresPage, etc.)
│   │   ├── components/
│   │   │   ├── layouts/          # AdminLayout, ArchitectLayout, LojistaLayout
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── lib/                  # Firebase, API client, utilities
│   │   ├── hooks/                # Custom hooks (useAuth, useApi)
│   │   ├── types/                # TypeScript types
│   │   ├── App.tsx               # Main app with routes
│   │   └── main.tsx              # Entry point
│   ├── Dockerfile                # Multi-stage Vite + Nginx build
│   ├── nginx.conf                # Production nginx config
│   ├── vite.config.ts            # Vite configuration
│   ├── package.json
│   └── tsconfig.json
│
├── railway.toml                  # Railway monorepo configuration
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README.md                     # This file

```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (recommended)
- npm 10+
- PostgreSQL 14+ (local development)
- Git

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/specpoints-saas.git
cd specpoints-saas
```

#### 2. Setup Backend API

```bash
cd spec-points-api

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your local database URL
# DATABASE_URL=postgresql://user:password@localhost:5432/specpoints

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Start development server (auto-reload with tsx watch)
npm run dev
```

Backend will be available at `http://localhost:3000`

#### 3. Setup Frontend

```bash
cd ../spec-points-web

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Keep default values for local development:
# VITE_API_URL=http://localhost:3000
# VITE_FIREBASE_* = already configured in .env.local

# Start Vite dev server with HMR
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### 4. Test the Application

1. Open http://localhost:5173 in your browser
2. Click "Login with Google" (or test account)
3. You'll be redirected to Firebase auth
4. After successful auth, you'll see the admin dashboard
5. Navigate through:
   - `http://localhost:5173/architects` - Architect management
   - `http://localhost:5173/stores` - Store management
   - `http://localhost:5173/sales` - Sales transactions
   - `http://localhost:5173/prizes` - Prize management
   - `http://localhost:5173/redemptions` - Redemption tracking

### Running Production Builds Locally

```bash
# Backend
cd spec-points-api
npm run build
NODE_ENV=production npm start

# Frontend (in another terminal)
cd spec-points-web
npm run build
npm run preview
```

---

## 🌐 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/verify-token      - Verify JWT token
```

### Architect Endpoints (Admin only)
```
GET    /api/architects             - List all architects
GET    /api/architects/:id         - Get architect details
POST   /api/architects             - Create architect
PUT    /api/architects/:id         - Update architect
DELETE /api/architects/:id         - Delete architect
PATCH  /api/architects/:id/status  - Update status (pending/active/blocked)
```

### Store Endpoints (Admin only)
```
GET    /api/stores                 - List all stores
GET    /api/stores/:id             - Get store details
POST   /api/stores                 - Create store
PUT    /api/stores/:id             - Update store
DELETE /api/stores/:id             - Delete store
PATCH  /api/stores/:id/status      - Toggle active/inactive
```

### Sales Endpoints (Admin only)
```
GET    /api/sales                  - List sales with auto-calculated points
GET    /api/sales/:id              - Get sale details
POST   /api/sales                  - Create sale (points auto-calculated: floor(amount_usd))
PUT    /api/sales/:id              - Update sale
DELETE /api/sales/:id              - Delete sale
```

### Prize Endpoints (Admin only)
```
GET    /api/prizes                 - List prizes with filters
GET    /api/prizes/:id             - Get prize details
POST   /api/prizes                 - Create prize
PUT    /api/prizes/:id             - Update prize
DELETE /api/prizes/:id             - Delete prize
PATCH  /api/prizes/:id/active      - Toggle active/inactive
```

### Redemption Endpoints (Admin only)
```
GET    /api/redemptions            - List redemptions with status
GET    /api/redemptions/:id        - Get redemption details
POST   /api/redemptions            - Create redemption request
PUT    /api/redemptions/:id        - Update redemption
DELETE /api/redemptions/:id        - Delete redemption
PATCH  /api/redemptions/:id/status - Update status (pending→approved→delivered)
```

### Dashboard Endpoint
```
GET    /api/dashboard              - Get aggregated statistics
```

---

## 🧪 Testing

### Frontend Tests
```bash
cd spec-points-web
npm run lint                       # ESLint
# Note: Add Vitest for unit tests as needed
```

### Backend Tests
```bash
cd spec-points-api
npm run lint                       # ESLint
npm test                          # Vitest (if configured)
```

### API Testing with cURL

```bash
# Get all architects (replace token with valid JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/architects

# Create a sale
curl -X POST http://localhost:3000/api/sales \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "architect_id": 1,
    "store_id": 1,
    "client_name": "John Doe",
    "client_phone": "555-1234",
    "amount_usd": 100,
    "description": "Material sale"
  }'
```

---

## 🚀 Deployment

### Deploy to Railway

For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Steps:**
1. Create Railway account (https://railway.app)
2. Connect GitHub repository
3. Add PostgreSQL service
4. Configure environment variables for both services
5. Deploy automatically on push to main branch

**Deployed URLs** (after deployment):
- Frontend: `https://spec-points-web.railway.app`
- Backend API: `https://spec-points-api.railway.app`

### Environment Variables Required

**Backend (`spec-points-api`)**:
- `DATABASE_URL` - PostgreSQL connection string
- `FIREBASE_PROJECT_ID` - From Firebase console
- `FIREBASE_PRIVATE_KEY` - Admin SDK private key
- `FIREBASE_CLIENT_EMAIL` - Admin SDK service account email
- `JWT_SECRET` - Random secure string for JWT signing
- `CORS_ORIGIN` - Frontend URL (e.g., https://spec-points-web.railway.app)

**Frontend (`spec-points-web`)**:
- `VITE_API_URL` - Backend API URL (e.g., https://spec-points-api.railway.app/api)
- `VITE_FIREBASE_API_KEY` - Firebase web API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

---

## 📊 Database Schema

The PostgreSQL database includes:

### Core Tables
- **users**: Firebase authentication users
- **architects**: Professional user profiles
- **stores**: Partner store locations
- **sales**: Transaction records with point calculations
- **prizes**: Reward catalog
- **redemptions**: Point redemption tracking

### Security Tables
- **login_attempts**: Rate limiting tracking
- **security_audit_log**: All user actions audit trail

### Key Features
- Row-level security (RLS) policies
- GENERATED ALWAYS AS columns for point calculations
- Foreign key constraints
- Timestamp tracking (created_at, updated_at)
- Status fields for workflow tracking

See database schema migrations in `spec-points-api/src/db/migrate.ts`

---

## 🎨 Design System

### Colors
- **Primary**: Teal/Petróleo (`#0F766E`, `#155E75`)
- **Secondary**: Gold/Sand (`#D4AF37`, `#FCD34D`)
- **Neutral**: Grays for text and backgrounds
- **Status**: Green (success), Red (error), Yellow (warning), Blue (info)

### Component Library
All UI components from **shadcn/ui**, exported from `src/components/ui/index.ts`:
- Button, Card, Dialog, Form, Input, Label
- Select, Textarea, Toggle, Checkbox, RadioGroup
- Tooltip, Alert, Badge, Accordion, Tabs

### Responsive Breakpoints (Tailwind)
- **Mobile**: Default (0px)
- **sm**: 640px (tablets)
- **md**: 768px (small laptops)
- **lg**: 1024px (desktops)
- **xl**: 1280px (large screens)

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- 44px minimum touch targets on mobile
- Proper heading hierarchy
- Color contrast compliance

---

## 🔐 Security Features

- ✅ Firebase authentication with email verification
- ✅ JWT token validation on every protected endpoint
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Helmet.js for security headers
- ✅ CORS configuration per environment
- ✅ SQL injection prevention via parameterized queries
- ✅ Audit logging of all administrative actions
- ✅ Row-level security in PostgreSQL
- ✅ HTTPS enforcement in production

---

## 📈 Performance Optimizations

### Frontend
- Vite for fast builds and HMR
- Code splitting with React.lazy
- Image optimization
- CSS minification
- Gzip compression via Nginx
- PWA support (service workers, manifest)

### Backend
- Connection pooling via pg-promise
- Query optimization with indexes
- Response caching headers
- Rate limiting to prevent abuse
- Multi-stage Docker build for smaller images

### Database
- Indexed columns on foreign keys and frequently queried fields
- Partition strategies for large tables
- Connection pooling configuration

---

## 🛣 Roadmap

### Phase 1 - MVP (Current ✅)
- [x] Authentication system
- [x] All 5 CRUD modules (Architects, Stores, Sales, Prizes, Redemptions)
- [x] Mobile-first responsive design
- [x] Dashboard with statistics
- [x] Railway deployment ready

### Phase 2 - Enhancement
- [ ] Advanced filtering and search
- [ ] Bulk operations (import/export)
- [ ] Email notifications
- [ ] Reward tier system
- [ ] Analytics dashboard

### Phase 3 - Scaling
- [ ] Mobile apps (iOS/Android)
- [ ] API v2 with versioning
- [ ] Webhook support for integrations
- [ ] Advanced reporting and BI
- [ ] Multi-tenant support

---

## 🐛 Troubleshooting

### API Connection Issues
```
Error: CORS error or API not found

Solution:
1. Verify backend is running: curl http://localhost:3000/health
2. Check VITE_API_URL in frontend .env.local
3. Verify CORS_ORIGIN in backend .env matches frontend URL
```

### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
1. Ensure PostgreSQL is running
2. Verify DATABASE_URL in backend .env
3. Check database credentials and port
4. Run: psql -U postgres -h localhost (to verify connectivity)
```

### Firebase Authentication Not Working
```
Error: 403 Unauthorized or permission denied

Solution:
1. Verify Firebase credentials in .env files
2. Check Firebase project has Web authentication enabled
3. Verify app is added to Firebase project
4. Check redirect URIs in Firebase console
```

### Build Fails
```
Solution:
1. Clear node_modules and reinstall: rm -rf node_modules && npm install
2. Check Node version: node --version (should be 20+)
3. Check for TypeScript errors: npm run lint
4. Review build logs for specific errors
```

---

## 📚 Additional Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Railway Docs**: https://docs.railway.app
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Review relevant service README in `spec-points-api/README.md` or `spec-points-web/README.md`
3. Check application logs via Railway dashboard
4. Review database schema in migrations

---

## 📄 License

MIT License - See LICENSE file for details

---

**Project Status**: Ready for Production Deployment ✅  
**Last Updated**: March 9, 2026  
**Version**: 1.0.0-alpha
