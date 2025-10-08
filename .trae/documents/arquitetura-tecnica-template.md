# Documento de Arquitetura Técnica - Template SaaS Next.js

## 1. Arquitetura Geral

```mermaid
graph TD
    A[User Browser] --> B[Next.js Frontend Application]
    B --> C[Clerk Authentication]
    B --> D[API Routes]
    D --> E[Prisma ORM]
    E --> F[PostgreSQL Database]
    D --> G[External AI Providers]
    D --> H[Vercel Blob Storage]
    D --> I[Stripe/Clerk Commerce]
    
    subgraph "Frontend Layer"
        B
        J[React Components]
        K[Tailwind CSS]
        L[Radix UI]
    end
    
    subgraph "Backend Layer"
        D
        M[Middleware]
        N[API Validation]
        O[Credit System]
    end
    
    subgraph "Data Layer"
        F
        P[Redis Cache - Future]
    end
    
    subgraph "External Services"
        C
        G
        H
        I
    end
```

## 2. Stack Tecnológico

### Frontend
- **React 19** + **Next.js 15.5.4** com App Router
- **TypeScript 5** para type safety
- **Tailwind CSS 4.1.13** para estilização
- **Radix UI** para componentes acessíveis
- **Framer Motion 12.23.12** para animações
- **TanStack Query 5.82.0** para state management
- **React Hook Form 7.60.0** + **Zod 4.0.2** para formulários

### Backend
- **Next.js API Routes** (App Router)
- **Prisma 6.16.3** como ORM
- **PostgreSQL** como banco principal
- **Clerk** para autenticação e billing

### Integrações
- **Vercel AI SDK 5.0.57** para chat IA
- **Vercel Blob** para storage de arquivos
- **Stripe** via Clerk Commerce para pagamentos

## 3. Definições de Rotas

| Rota | Propósito |
|------|-----------|
| `/` | Landing page pública com hero, features e pricing |
| `/sign-in` | Página de login integrada com Clerk |
| `/sign-up` | Página de registro integrada com Clerk |
| `/dashboard` | Dashboard principal do usuário autenticado |
| `/ai-chat` | Interface de chat com IA e upload de arquivos |
| `/billing` | Gestão de assinaturas e planos |
| `/admin` | Painel administrativo (acesso restrito) |
| `/admin/users` | Gestão de usuários e créditos |
| `/admin/settings` | Configurações de custos e planos |
| `/admin/storage` | Gestão de arquivos e storage |
| `/subscribe` | Página de checkout e assinaturas |

## 4. Definições de API

### 4.1 APIs Principais

#### Autenticação e Usuários
```
GET /api/credits/me
```
Retorna saldo de créditos do usuário atual

Response:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| creditsRemaining | number | Créditos disponíveis |
| lastSyncedAt | string | Última sincronização com Clerk |

Exemplo:
```json
{
  "creditsRemaining": 85,
  "lastSyncedAt": "2024-01-15T10:30:00Z"
}
```

#### Chat IA
```
POST /api/ai/chat
```

Request:
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| provider | string | true | Provedor de IA (openai, anthropic, google, mistral, openrouter) |
| model | string | true | Modelo específico do provedor |
| messages | array | true | Array de mensagens do chat |
| temperature | number | false | Temperatura para geração (0-2) |
| attachments | array | false | Arquivos anexados |

Response: Stream de texto via Server-Sent Events

#### Upload de Arquivos
```
POST /api/upload
```

Request: multipart/form-data com campo `file`

Response:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| url | string | URL pública do arquivo |
| pathname | string | Caminho interno |
| contentType | string | Tipo MIME |
| size | number | Tamanho em bytes |
| name | string | Nome original |

#### Administração
```
GET /api/admin/users
POST /api/admin/credits/[id]
GET /api/admin/settings
PUT /api/admin/settings
```

### 4.2 Webhooks

#### Clerk Webhooks
```
POST /api/webhooks/clerk
```
Processa eventos de usuário, assinatura e pagamentos do Clerk

Eventos suportados:
- `user.created` - Criação de usuário
- `subscription.created` - Nova assinatura
- `subscription.updated` - Atualização de plano
- `invoice.payment_succeeded` - Pagamento aprovado

## 5. Arquitetura do Servidor

```mermaid
graph TD
    A[Client Request] --> B[Next.js Middleware]
    B --> C[Route Handler]
    C --> D[Authentication Check]
    D --> E[Input Validation]
    E --> F[Business Logic Layer]
    F --> G[Data Access Layer]
    G --> H[Database/External APIs]
    
    subgraph "Middleware Layer"
        B
        I[CORS]
        J[Rate Limiting]
        K[Auth Validation]
    end
    
    subgraph "Service Layer"
        F
        L[Credit Management]
        M[AI Provider Integration]
        N[File Processing]
    end
    
    subgraph "Data Layer"
        G
        O[Prisma Queries]
        P[Cache Layer]
    end
```

## 6. Modelo de Dados

### 6.1 Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    USER ||--o{ CREDIT_BALANCE : has
    USER ||--o{ USAGE_HISTORY : tracks
    USER ||--o{ STORAGE_OBJECT : uploads
    USER ||--o{ SUBSCRIPTION_EVENT : generates
    CREDIT_BALANCE ||--o{ USAGE_HISTORY : records
    
    USER {
        string id PK
        string clerkId UK
        string email UK
        string name
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    CREDIT_BALANCE {
        string id PK
        string userId FK
        string clerkUserId UK
        int creditsRemaining
        datetime lastSyncedAt
        datetime createdAt
        datetime updatedAt
    }
    
    USAGE_HISTORY {
        string id PK
        string userId FK
        string creditBalanceId FK
        enum operationType
        int creditsUsed
        json details
        datetime timestamp
    }
    
    PLAN {
        string id PK
        string clerkId UK
        string name
        int credits
        boolean active
        int sortOrder
        string currency
        int priceMonthlyCents
        int priceYearlyCents
        text description
        json features
        datetime createdAt
        datetime updatedAt
    }
    
    STORAGE_OBJECT {
        string id PK
        string userId FK
        string clerkUserId
        string provider
        string url
        string pathname
        string name
        string contentType
        int size
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }
    
    SUBSCRIPTION_EVENT {
        string id PK
        string userId FK
        string clerkUserId
        string planKey
        string status
        string eventType
        datetime occurredAt
        json metadata
        datetime createdAt
    }
    
    ADMIN_SETTINGS {
        string id PK
        json featureCosts
        datetime createdAt
        datetime updatedAt
    }
```

### 6.2 DDL (Data Definition Language)

#### Tabela de Usuários
```sql
-- Tabela principal de usuários
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Índices para performance
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_name_idx" ON "User"("name");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
```

#### Tabela de Saldo de Créditos
```sql
-- Saldo de créditos por usuário
CREATE TABLE "CreditBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "creditsRemaining" INTEGER NOT NULL DEFAULT 100,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "CreditBalance_pkey" PRIMARY KEY ("id")
);

-- Relacionamentos e índices
ALTER TABLE "CreditBalance" ADD CONSTRAINT "CreditBalance_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CreditBalance_userId_key" ON "CreditBalance"("userId");
CREATE UNIQUE INDEX "CreditBalance_clerkUserId_key" ON "CreditBalance"("clerkUserId");
CREATE INDEX "CreditBalance_creditsRemaining_idx" ON "CreditBalance"("creditsRemaining");
```

#### Tabela de Histórico de Uso
```sql
-- Histórico de consumo de créditos
CREATE TABLE "UsageHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditBalanceId" TEXT NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UsageHistory_pkey" PRIMARY KEY ("id")
);

-- Enum para tipos de operação
CREATE TYPE "OperationType" AS ENUM ('AI_TEXT_CHAT', 'AI_IMAGE_GENERATION');

-- Relacionamentos e índices
ALTER TABLE "UsageHistory" ADD CONSTRAINT "UsageHistory_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UsageHistory" ADD CONSTRAINT "UsageHistory_creditBalanceId_fkey" 
    FOREIGN KEY ("creditBalanceId") REFERENCES "CreditBalance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "UsageHistory_userId_idx" ON "UsageHistory"("userId");
CREATE INDEX "UsageHistory_timestamp_idx" ON "UsageHistory"("timestamp");
CREATE INDEX "UsageHistory_operationType_idx" ON "UsageHistory"("operationType");
CREATE INDEX "UsageHistory_userId_timestamp_idx" ON "UsageHistory"("userId", "timestamp");
```

#### Tabela de Planos
```sql
-- Planos de assinatura
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT,
    "clerkName" TEXT,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT,
    "priceMonthlyCents" INTEGER,
    "priceYearlyCents" INTEGER,
    "description" TEXT,
    "features" JSONB,
    "badge" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "ctaType" TEXT DEFAULT 'checkout',
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "billingSource" TEXT NOT NULL DEFAULT 'clerk',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_clerkId_key" ON "Plan"("clerkId");
CREATE INDEX "Plan_active_idx" ON "Plan"("active");
CREATE INDEX "Plan_sortOrder_idx" ON "Plan"("sortOrder");
```

#### Configurações Administrativas
```sql
-- Configurações globais do sistema
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "featureCosts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- Dados iniciais
INSERT INTO "AdminSettings" ("id", "featureCosts") VALUES 
('singleton', '{"ai_text_chat": 1, "ai_image_generation": 5}');
```

## 7. Sistema de Créditos

### 7.1 Arquitetura de Créditos

```mermaid
graph TD
    A[User Action] --> B[validateCreditsForFeature]
    B --> C{Sufficient Credits?}
    C -->|Yes| D[deductCreditsForFeature]
    C -->|No| E[InsufficientCreditsError]
    D --> F[Execute Operation]
    F --> G{Operation Success?}
    G -->|Yes| H[Complete]
    G -->|No| I[refundCreditsForFeature]
    
    subgraph "Credit Management"
        J[getFeatureCost]
        K[getUserCredits]
        L[trackUsage]
    end
```

### 7.2 Configuração de Custos

```typescript
// src/lib/credits/feature-config.ts
export const FEATURE_CREDIT_COSTS = {
  ai_text_chat: 1,
  ai_image_generation: 5,
} as const

// Mapeamento para enum do Prisma
const FEATURE_TO_OPERATION: Record<FeatureKey, OperationType> = {
  ai_text_chat: OperationType.AI_TEXT_CHAT,
  ai_image_generation: OperationType.AI_IMAGE_GENERATION,
}
```

### 7.3 Fluxo de Validação e Dedução

```typescript
// Validação antes da operação
await validateCreditsForFeature(userId, 'ai_text_chat')

// Dedução com tracking
await deductCreditsForFeature({
  clerkUserId: userId,
  feature: 'ai_text_chat',
  details: { provider: 'openai', model: 'gpt-4' }
})

// Reembolso em caso de falha
await refundCreditsForFeature({
  clerkUserId: userId,
  feature: 'ai_text_chat',
  quantity: 1,
  reason: 'provider_error'
})
```

## 8. Integração com Provedores de IA

### 8.1 Arquitetura Multi-Provider

```typescript
// src/app/api/ai/chat/route.ts
function getModel(provider: string, model: string) {
  switch (provider) {
    case 'openai':
      return openai(model)
    case 'anthropic':
      return anthropic(model)
    case 'google':
      return google(model)
    case 'mistral':
      return mistral(model)
    case 'openrouter':
      return openrouter(model)
    default:
      throw new Error('Unsupported provider')
  }
}
```

### 8.2 Modelos Suportados

```typescript
const ALLOWED_MODELS: Record<Provider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  anthropic: ['claude-3.5-sonnet'],
  google: ['gemini-2.0-flash-001'],
  mistral: ['mistral-small-latest'],
  openrouter: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet']
}
```

## 9. Segurança e Validação

### 9.1 Middleware de Autenticação

```typescript
// src/middleware.ts
export default clerkMiddleware((auth, req) => {
  // Protege rotas administrativas
  if (req.nextUrl.pathname.startsWith('/admin')) {
    auth().protect()
  }
  
  // Protege rotas de usuário
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    auth().protect()
  }
})
```

### 9.2 Validação de Input

```typescript
// Schemas Zod para validação
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(20000),
})

const BodySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'openrouter']),
  model: z.string().min(1),
  messages: z.array(MessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
}).strict()
```

## 10. Performance e Otimização

### 10.1 Caching Strategy

- **React Query**: Cache de dados do usuário (créditos, configurações)
- **Next.js**: Static generation para landing page
- **Prisma**: Connection pooling e query optimization

### 10.2 Streaming e Real-time

- **AI Chat**: Server-Sent Events para streaming de respostas
- **File Upload**: Progress tracking com feedback visual
- **Credit Updates**: Refresh automático após operações

### 10.3 Bundle Optimization

- **Code Splitting**: Lazy loading de componentes pesados
- **Tree Shaking**: Eliminação de código não utilizado
- **Image Optimization**: Next.js Image component com WebP

## 11. Deployment e Infraestrutura

### 11.1 Variáveis de Ambiente

```bash
# Autenticação
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:5432/db
PRISMA_CLIENT_ENGINE_TYPE=binary

# IA Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=sk-or-...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-...
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 11.2 Scripts de Deploy

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"
  }
}
```

### 11.3 Health Checks

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected' },
      { status: 503 }
    )
  }
}
```