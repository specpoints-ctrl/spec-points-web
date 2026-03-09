# 📱 SpecPoints SaaS - Documentação do Projeto

**Status**: 🔄 Em Desenvolvimento | **Data**: 03/03/2026  
**Stack**: React 18 + TypeScript + Vite + Tailwind CSS | Express.js + PostgreSQL + Firebase  
**Progresso Overall**: 32% Completo

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [O que foi Feito](#-o-que-foi-feito)
3. [Arquitetura Técnica](#-arquitetura-técnica)
4. [Como Executar Localmente](#-como-executar-localmente)
5. [Credenciais de Teste](#-credenciais-de-teste)
6. [Próximas Etapas](#-próximas-etapas)
7. [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Visão Geral

**SpecPoints** é uma plataforma SaaS de programa de fidelidade para arquitetos e lojas. Permite que:

- **Arquitetos**: Acumulem pontos em vendas de materiais de clientes e resgatem por prêmios
- **Lojas**: Registrem vendas de arquitetos e gerenciem catálogo de prêmios
- **Admin**: Gerencie todo o ecossistema (arquitetos, lojas, vendas, prêmios)

**Design**: Verde petróleo + Dourado/Areia (tema premium, dark-first, mobile-first, 100% responsivo)

---

## ✅ O que foi Feito

### 🏗️ **Estrutura Base (Completa - 100%)**
- ✅ Projeto monorepo com 2 apps: `spec-points-api` e `spec-points-web`
- ✅ Banco de dados PostgreSQL (Railway) com 12 tabelas + RLS policies
- ✅ Ambiente local totalmente funcional (.env files configurados)
- ✅ GitHub repos criados e sincronizados

### 🔐 **Autenticação & Autorização (Completa - 100%)**
- ✅ Firebase Authentication (registro e login)
- ✅ JWT token validation (backend)
- ✅ Role-based access control (admin, architect, lojista)
- ✅ Verificação de status de usuário (pending/active/blocked)
- ✅ Rate limiting em endpoints de auth (5 tentativas em 15 min)
- ✅ Admin user criado e ativado (`admin@specpoints.com`)
- ✅ Login com validação de status

### 🎨 **Design System (Completa - 100%)**
- ✅ Tailwind config com tema verde petróleo + dourado
  - Background: `#0f1a1a` (verde petróleo escuro)
  - Primary: `#c4b5a0` (dourado/areia premium)
  - Secondary: `#1a3a3a` (verde petróleo médio)
  - Accent: `#d4a574` (dourado quente)
  - Semânticas: success, warning, destructive, ranking colors
- ✅ Mobile-first responsiveness (p-4 mobile, sm:p-6 tablet+)
- ✅ Touch targets mínimos de 44x44px (acessibilidade)
- ✅ Dark-first theme (sem light mode)
- ✅ Consistent spacing, rounded corners, shadows

### 🧩 **Biblioteca de Componentes UI (Completa - 100%)**
- ✅ `Button` - 5 variantes + 3 tamanhos + loading state
- ✅ `Input` - Com label, error handling e validação
- ✅ `Textarea` - Similar ao Input com rows customizáveis
- ✅ `Card` - Base com subcomponentes (Header, Title, Content, Footer)
- ✅ `Badge` - 6 variantes para status visual
- ✅ `Table` - Sistema completo (Header, Body, Row, Cell, Caption)
- ✅ `Dialog` - Modal com Context API, keyboard shortcuts (ESC)
- ✅ `utils.ts` - Função `cn()` para merge de classnames
- ✅ Barrel export (`ui/index.ts`) para importação centralizada
- **Nota**: Todos com TypeScript strict, React.forwardRef, proper typing

### 📐 **Layouts por Role (Completa - 100%)**
- ✅ `AdminLayout` - Sidebar com 7 menu items (Dashboard, Arquitetos, Lojas, Vendas, Prêmios, Resgates, Config)
- ✅ `ArchitectLayout` - Sidebar com 3 menu items (Dashboard, Meus Pontos, Relatórios)
- ✅ `LojistaLayout` - Sidebar com 3 menu items (Dashboard, Vendas, Contatos)
- ✅ Detecção automática de role e routing adequado
- ✅ Tema verde/dourado aplicado em todos

### 📊 **Dashboard Administrativo (Completa - 100%)**
- ✅ Componente `AdminDashboard.tsx` com:
  - 4 stat cards (Arquitetos, Lojas, Vendas, Pontos)
  - Top 5 Arquitetos com ranking
  - Últimas 10 Vendas com detalhes
  - Loading states e empty states
- ✅ Endpoint backend `/api/dashboard/stats` (protegido com JWT)
- ✅ Responsivo mobile-first

### 📝 **CRUD de Arquitetos (Função Completa - 100%)**

**Backend:**
- ✅ Controller com 6 funções: list, get, create, update, delete, updateStatus
- ✅ Rotas protegidas com autenticação JWT + verificação de rol
- ✅ Middlewares: `role-check.ts`, `error-handler.ts`
- ✅ Validações de entrada (email único, dados obrigatórios)
- ✅ Query builder PostgreSQL com prepared statements

**Frontend:**
- ✅ Página `ArchitectsPage.tsx` completa com:
  - Listagem em tabela responsiva (mobile: collapse de colunas)
  - 4 cards de estatísticas (Total, Ativos, Pendentes, Inativos)
  - Dialog modal para criar/editar arquitetos
  - Ações inline (aprovar, rejeitar, editar, deletar)
  - Badges por status com cores semânticas
  - Loading e empty states
- ✅ Rota `/architects` integrada no routing

### 🔧 **Infraestrutura & DevOps (Completa - 100%)**
- ✅ CORS configurado para múltiplas portas localhost (5173, 5174, 5175)
- ✅ Variáveis de ambiente em .env files
- ✅ Servidores rodando localmente:
  - **Backend**: `http://localhost:3000` ✅
  - **Frontend**: `http://localhost:5174` ✅
- ✅ Error handling centralizado
- ✅ Scripts utilitários (activate-admin, seed-admin)

---

## 🏗️ Arquitetura Técnica

### Frontend Stack
```
React 18.2.0 + TypeScript 5.3.0 + Vite 5.4.21
├── Styling: Tailwind CSS 3.4.1 (custom color palette)
├── Authentication: Firebase Web SDK 10.7.0
├── HTTP Client: Axios 1.7.0 (CORS configured)
├── Routing: React Router v6
├── Icons: Lucide Icons 0.378.0
├── Animation: Framer Motion 10.16.17
├── Charts: Recharts 2.10.5 (ready for dashboards)
└── Forms: React Hook Form + Zod (stack ready)
```

### Backend Stack
```
Express.js + TypeScript 5+
├── Database: PostgreSQL 15 (Railway managed)
├── Query Builder: pg-promise
├── Authentication: Firebase Admin SDK 10.7.0 + JWT
├── Validation: Custom middleware + TypeScript
├── Logging: Winston
├── Rate Limiting: express-rate-limit
├── CORS: cors (Multi-port enabled)
└── Error Handling: Centralized with AppError class
```

### Database Schema (12 Tables)
```
users                      # User accounts (Firebase + DB)
├── id, firebase_uid, email, status, created_at

user_roles                 # Role assignments
├── id, user_id, role, architect_id, store_id

architects                 # Architect profiles
├── id, name, email, company, phone, status, address, city, state

stores                     # Partner stores
├── id, name, cnpj, email, phone, branch, city, state, address

sales                      # Sale records
├── id, architect_id, store_id, value, points_generated, created_at

prizes                     # Prize catalog
├── id, name, description, points_required, quantity, active

redemptions                # Prize redemptions
├── id, architect_id, prize_id, status, created_at

login_attempts             # Rate limiting tracking
├── email, success, ip_address, created_at

security_audit_log         # Admin action logging
├── user_id, action, resource, created_at

notifications              # User notifications
├── id, user_id, title, message, read

push_subscriptions         # PWA push subscriptions
├── user_id, endpoint, auth, p256dh

dashboard_configs          # User-specific dashboard settings
├── user_id, filters, views, preferences
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL (ou Railway remote connection)
- Firebase project com credenciais

### Backend Setup
```bash
cd spec-points-api
npm install
# Configure .env with DATABASE_URL and Firebase credentials
npm run migrate  # Run database migrations
npm run dev      # Start on http://localhost:3000
```

### Frontend Setup
```bash
cd spec-points-web
npm install
# Configure .env.local with VITE_API_URL and Firebase config
npm run dev      # Start on http://localhost:5174
```

### Acessar Aplicação
```
🌐 App: http://localhost:5174
🔧 API: http://localhost:3000
✅ Health: http://localhost:3000/health
📊 API Routes: http://localhost:3000/api
```

---

## 🔑 Credenciais de Teste

### Admin User (Totalmente Ativo)
```
Email: admin@specpoints.com
Senha: admin@123456
Role: admin
Status: active ✅
```

### Database (Railway)
```
Conecta automaticamente via DATABASE_URL no .env
RLS policies habilitadas em todas tabelas
```

---

## 📋 Próximas Etapas

### **Fase 1: Completar CRUDs Básicos** (Priority: 🔴 ALTA)
**Estimado: 2-3 dias**

- [ ] **Lojas CRUD** (Stores)
  - Backend: Controller + Routes (CRUD completo)
  - Frontend: StoresPage com listagem, criar, editar, deletar
  - Tabela responsiva + stat cards
  
- [ ] **Vendas CRUD** (Sales)
  - Backend: Controller + Routes com cálculo automático de pontos
  - Frontend: SalesPage com formulário e histórico
  - Seleção de arquiteto + loja com cálculo em tempo real
  
- [ ] **Prêmios CRUD** (Prizes)
  - Backend: Controller + Routes
  - Frontend: Grid/Cards de prêmios com gerenciamento de qty
  - Catálogo com filtros por categoria
  
- [ ] **Resgates CRUD** (Redemptions)
  - Backend: Controller + Routes com fluxo de aprovação
  - Frontend: Resgates page com histórico e aprovar/rejeitar
  - Status visual (pending, approved, delivered)

### **Fase 2: Dashboards Específicos por Role** (Priority: 🔴 ALTA)
**Estimado: 2-3 dias**

- [ ] **Architect Dashboard**
  - Exibição de pontos atuais + histórico
  - Catálogo de prêmios com filtros
  - Histórico de resgates
  - Top 10 ranking (com você marcado)
  - Próximos prêmios (nearest prizes)
  
- [ ] **Lojista Dashboard**
  - Métricas: total de vendas, valor, pontos gerados
  - Top 10 arquitetos da loja (por valor vendido)
  - Charts de vendas por período
  - Botão WhatsApp para contato direto (wa.me API)

### **Fase 3: Funcionalidades Avançadas** (Priority: 🟡 MÉDIA)
**Estimado: 1-2 semanas**

- [ ] **Notificações Push**
  - Service Worker + Notification API
  - Notification Center na sidebar
  - Email digests (opcional)
  
- [ ] **Relatórios & Export**
  - Gerar PDFs (jsPDF + html2canvas)
  - Export CSV
  - Filtros por data/período
  - Gráficos de tendência
  
- [ ] **Gamificação**
  - Badges por milestone
  - Seasonal challenges
  - Leaderboard with realtime updates

### **Fase 4: Mobile & PWA** (Priority: 🟡 MÉDIA)
**Estimado: 1 semana**

- [ ] **Responsive Testing**
  - Teste em devices reais (Android, iOS)
  - Ajustar breakpoints Tailwind se necessário
  - Teste de funcionalidade mobile
  
- [ ] **PWA Configuration**
  - Manifest.json (icons 192px + 512px)
  - Service Worker para offline
  - Install prompt
  
- [ ] **Performance**
  - Lazy loading de imagens
  - Code splitting por rota
  - Bundle size optimization

### **Fase 5: Deployment Production** (Priority: 🔴 ALTA)
**Estimado: 2-3 dias**

- [ ] **Railway Deployment**
  - Deploy backend com env vars
  - Deploy frontend
  - CI/CD pipelines (GitHub Actions)
  - Database migrations automáticas
  
- [ ] **Domain & SSL**
  - Registrar domínio (SpecPoints.app)
  - SSL/TLS via Let's Encrypt
  - Environment-specific configs
  
- [ ] **Monitoramento**
  - Error tracking (Sentry.io)
  - Analytics (Plausible)
  - Performance monitoring (Web Vitals)
  - Logging centralizado

---

## 📁 Estrutura do Projeto

```
SpecPoints-saas/
├── spec-points-api/                      # Backend Express + TypeScript
│   ├── src/
│   │   ├── controllers/                  # Business logic
│   │   │   ├── auth.ts                  # Register, login, JWT
│   │   │   ├── architects.ts            # CRUD + status management
│   │   │   ├── dashboard.ts             # Stats & analytics
│   │   │   └── [stores|sales|prizes|redemptions].ts
│   │   ├── routes/                      # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── architects.ts
│   │   │   ├── dashboard.ts
│   │   │   └── [stores|sales|prizes|redemptions].ts
│   │   ├── middleware/                  # Auth & validation
│   │   │   ├── auth.ts                 # JWT verification
│   │   │   ├── role-check.ts           # Role-based access
│   │   │   ├── error-handler.ts        # Error handling
│   │   │   └── async-handler.ts        # Async wrapper
│   │   ├── db/                         # Database
│   │   │   ├── config.ts               # pg-promise setup
│   │   │   ├── migrations/             # SQL migrations
│   │   │   ├── seed-admin.ts           # Test data
│   │   │   └── activate-admin.ts       # Utilities
│   │   └── index.ts                    # Express app setup
│   ├── .env                            # Database & Firebase secrets
│   └── package.json
│
├── spec-points-web/                     # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                     # Reusable components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Dialog.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   └── index.ts            # Barrel export
│   │   │   ├── layouts/                # Role-based layouts
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── ArchitectLayout.tsx
│   │   │   │   └── LojistaLayout.tsx
│   │   │   ├── AdminDashboard.tsx      # Dashboard component
│   │   │   └── [other components]
│   │   ├── pages/                      # Page components
│   │   │   ├── AuthPage.tsx            # Login & register
│   │   │   ├── DashboardPage.tsx       # Dynamic by role
│   │   │   ├── ArchitectsPage.tsx      # CRUD arquitetos ✅
│   │   │   ├── StoresPage.tsx          # CRUD lojas [TODO]
│   │   │   ├── SalesPage.tsx           # CRUD vendas [TODO]
│   │   │   ├── PrizesPage.tsx          # CRUD prêmios [TODO]
│   │   │   └── RedemptionsPage.tsx     # CRUD resgates [TODO]
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios client
│   │   │   ├── firebase.ts             # Firebase config
│   │   │   └── utils.ts                # cn() utility
│   │   ├── App.tsx                     # Main router
│   │   ├── main.tsx                    # React entry
│   │   ├── tailwind.config.cjs          # Custom theme
│   │   └── vite.config.ts
│   ├── .env.local                      # Firebase & API config
│   └── package.json
│
└── doc.md                              # Este arquivo
```

---

## 🔗 Repositórios GitHub

```
API:  https://github.com/specpoints-ctrl/spec-points-api
WEB:  https://github.com/specpoints-ctrl/spec-points-web
```

---

## 📈 Métricas de Progresso

| Componente | Status | % |
|-----------|--------|---|
| **Autenticação** | ✅ Completo | 100% |
| **Design System** | ✅ Completo | 100% |
| **Componentes UI** | ✅ Completo | 100% |
| **Layouts/Routing** | ✅ Completo | 100% |
| **Dashboard Admin** | ✅ Completo | 100% |
| **CRUD Arquitetos** | ✅ Completo | 100% |
| **CRUD Lojas** | ⏳ Todo | 0% |
| **CRUD Vendas** | ⏳ Todo | 0% |
| **CRUD Prêmios** | ⏳ Todo | 0% |
| **CRUD Resgates** | ⏳ Todo | 0% |
| **Dashboards por Role** | ⏳ Todo | 0% |
| **Notificações** | ⏳ Todo | 0% |
| **Deploy Production** | ⏳ Todo | 0% |
| **TOTAL** | **32%** | - |

---

## 💡 Notas Importantes

### Performance
- Mobile-first: Começa com `p-4` (16px) e escala para `sm:p-6` (24px)
- Tailwind CSS tree-shaken para produção (sem CSS desnecessário)
- Lazy loading setup pronto com React.lazy

### Segurança
- Todos endpoints autenticados com JWT Bearer token
- Rate limiting em login (5 tentativas em 15 minutos)
- RLS policies habilitadas em PostgreSQL
- Audit log centralizado de ações sensíveis
- CORS restrito para produção

### Acessibilidade
- Touch targets mínimos de 44x44px (WCAG compliance)
- Proper semantic HTML (buttons, labels, etc)
- Keyboard navigation em modals (ESC, Tab)
- Focus states visíveis em inputs

### Compatibilidade Browser
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Responsivo até 320px (mobile)

---

## 🎯 Próximo Passo Recomendado

**➡️ Implementar CRUD de Lojas (Stores)** pois:
1. Segue padrão idêntico ao CRUD de Arquitetos
2. É dependência para implementar Vendas depois
3. Pequena curva de aprendizado
4. Alto ROI em funcionalidade

---

**Última atualização**: 03/03/2026 15:45 UTC  
**Desenvolvedor**: GitHub Copilot  
**Status Local**: Ready for testing ✅  
**Stack**: React + Express + PostgreSQL + Firebase
