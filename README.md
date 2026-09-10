# NutriSnap

Acompanhamento de alimentação, calorias e treino, com estimativa nutricional a partir de foto.

> As estimativas do app são aproximações baseadas em fórmulas populacionais e em análise de imagem. Não são diagnóstico, prescrição dietética nem prescrição de exercício.

## Estrutura

```
nutrisnap/
├── packages/core/     # domínio puro + contratos Zod (compartilhado)
├── apps/api/          # backend Fastify + Prisma + camada de IA
├── apps/mobile/       # app Expo / React Native
└── docs/              # arquitetura, MVP, API
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/01-arquitetura.md](docs/01-arquitetura.md) | Camadas, responsabilidades, decisões e seus custos |
| [docs/02-mvp.md](docs/02-mvp.md) | Escopo do MVP, V2, métricas de sucesso |
| [docs/03-api.md](docs/03-api.md) | Endpoints, autenticação, validação, rate limit |

## Setup

```bash
npm install
npm run core:build          # compila o pacote compartilhado
npm run core:test           # 93 testes do domínio

cd apps/api
cp .env.example .env        # preencher com credenciais reais
npm run prisma:generate
npm run prisma:migrate
```

## Stack

**Mobile** — Expo, Expo Router, TypeScript, React Hook Form + Zod, Reanimated, TanStack Query, Zustand
**Backend** — Node 22, Fastify, Prisma, PostgreSQL, Zod
**Infra** — Supabase (Auth, Storage privado, Postgres gerenciado)
**IA** — camada `AIService` com adapters; padrão `claude-opus-5`

## Estado atual

- [x] Domínio compartilhado: TMB, TDEE, meta calórica, macros, porções, resumo diário (93 testes)
- [x] Contratos Zod de todos os fluxos
- [x] Schema Prisma completo
- [ ] Backend: rotas, camada de IA, prompts
- [ ] App: design system e telas
