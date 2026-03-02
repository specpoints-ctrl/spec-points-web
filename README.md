# 🎨 SpecPoints Web

Frontend do sistema de fidelidade SpecPoints - React + TypeScript + Vite

## 📋 Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom + Framer Motion
- **Charts:** Recharts
- **Auth:** Firebase
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Deploy:** Railway

## 🚀 Deploy no Railway

### 1. Criar Service

1. Acesse Railway: https://railway.app
2. New Project → Deploy from GitHub Repo
3. Selecione: `spec-points-web`
4. Railway detecta automaticamente Node.js

### 2. Configurar Variáveis de Ambiente

No Railway, adicione:

```bash
VITE_API_URL=https://spec-points-api.up.railway.app/api
VITE_FIREBASE_API_KEY=SuaFirebaseAPIKey
VITE_FIREBASE_AUTH_DOMAIN=spec-points-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spec-points-prod
VITE_FIREBASE_STORAGE_BUCKET=spec-points-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Verificar Deploy

Acesse: `https://seu-projeto.railway.app`

## 🛠️ Desenvolvimento Local

### Instalação

```bash
npm install
```

### Configurar Environment

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Firebase.

### Iniciar Servidor

```bash
npm run dev
```

App rodando em: `http://localhost:5173`

## 📱 Features

### Dashboards por Papel

- **Admin:** Gerenciamento completo (arquitetos, lojas, vendas, prêmios)
- **Arquiteto:** Visualizar pontos, resgatar prêmios, ranking
- **Lojista:** Registrar vendas, ver ranking de arquitetos

### Páginas

- `/auth` - Login, Cadastro, Recuperação de Senha
- `/` - Dashboard (varia por papel)
- `/architects` - CRUD Arquitetos (admin)
- `/stores` - CRUD Lojas (admin)
- `/sales` - Gestão de Vendas
- `/prizes` - Catálogo de Prêmios
- `/redemptions` - Histórico de Resgates
- `/users` - Gerenciamento de Usuários (admin)
- `/settings` - Configurações
- `/install` - Instalação PWA

### PWA (Progressive Web App)

- ✅ Instalável em mobile/desktop
- ✅ Offline support
- ✅ Service worker
- ✅ Ícones otimizados

## 🎨 Design System

### Cores

- **Primary:** `#007AFF` (Azul Apple)
- **Secondary:** `#34C759` (Verde Success)
- **Destructive:** `#FF3B30` (Vermelho)
- **Warning:** `#FF9500` (Laranja)

### Componentes

- Custom UI components baseados em Tailwind
- Animações com Framer Motion
- Gráficos com Recharts
- Icons com Lucide React

## 📦 Scripts

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Lint código

## 🔗 Integração com Backend

### API Client

```typescript
import { api } from './services/api';

// Exemplo de chamada
const { data } = await api.get('/architects');
```

### Autenticação

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, role, logout } = useAuth();
  
  if (role === 'admin') {
    // Render admin UI
  }
}
```

## 🔒 Segurança

- ✅ Firebase authentication
- ✅ Protected routes por papel
- ✅ Token refresh automático
- ✅ HTTPS only em produção

## 📞 Suporte

Issues: https://github.com/specpoints-ctrl/spec-points-web/issues

## 📄 Licença

MIT © 2026 SpecPoints
