# Arquitetura

## Visão geral

```
┌─────────────────────────────┐
│  App (Expo / React Native)  │
│  UI · estado · cache        │
└──────┬───────────────┬──────┘
       │ JWT           │ upload direto (JWT + RLS)
       ▼               ▼
┌──────────────┐  ┌──────────────────┐
│  API Fastify │  │ Supabase Storage │
│  (Node/TS)   │  │ bucket privado   │
└──┬────────┬──┘  └────────┬─────────┘
   │        │              │ signed URL (5 min)
   ▼        ▼              │
┌────────┐ ┌───────────────▼─────┐
│Postgres│ │ AIService (porta)   │
│ Prisma │ │  └ AnthropicAdapter │
└────────┘ └─────────────────────┘
       ▲
       │ valida JWT (JWKS)
┌──────┴────────┐
│ Supabase Auth │
└───────────────┘
```

O app **nunca** fala com o provedor de IA. Nenhuma chave de IA existe no bundle.

---

## Camadas

### `packages/core` — domínio compartilhado

Zero I/O, zero framework. Roda igual em Node e em Hermes.

| Pasta | Responsabilidade |
|---|---|
| `domain/nutrition/` | TMB, TDEE, meta calórica, macros, porções, resumo diário, pós-processamento da análise de IA |
| `domain/disclaimers.ts` | Textos de isenção, servidos junto das respostas |
| `schemas/` | Contratos Zod: enums, perfil, alimento, refeição, IA, plano alimentar, treino, progresso |
| `utils/` | `DomainError`, arredondamento, ids de cliente |

**Por que existe:** o app calcula a meta calórica offline com exatamente o mesmo código do servidor. Nunca há dois números diferentes para a mesma pessoa. E a validação de um payload é literalmente o mesmo schema nos dois lados — mudar um campo quebra o build do app, não a produção.

**Regra:** se uma função precisa de relógio, rede ou banco, ela recebe isso por parâmetro. Sem exceção.

### `apps/api` — backend

```
src/
  modules/            # uma pasta por contexto de negócio
    auth/             # verificação de JWT, bootstrap do usuário
    users/            # perfil, metas, onboarding
    nutrition/        # cálculos, resumo diário, metas versionadas
    meals/            # diário alimentar, análise de foto
    foods/            # busca e cadastro de alimentos
    meal-plans/       # geração e edição do plano alimentar
    workouts/         # planos, sessões, séries
    progress/         # medidas e agregações
  services/
    ai/               # AIService (porta) + adapters + prompts + parsers
    storage/          # signed URLs do Supabase Storage
  database/           # PrismaClient, transações, repositórios
  middleware/         # auth, rate limit, error handler, request-id
  routes/             # registro das rotas e schemas HTTP
  config/             # env validado com Zod na subida
```

Cada módulo segue **route → controller → service → repository**:

- **route**: declara método, path, schema de entrada/saída e quais middlewares aplicam.
- **controller**: traduz HTTP ↔ domínio. Não contém regra de negócio.
- **service**: a regra de negócio. Não conhece `Request`/`Reply`.
- **repository**: único lugar que toca o Prisma.

O ganho concreto disso: testar "usuário com dieta agressiva recebe aviso de piso calórico" não exige subir um servidor HTTP.

### `apps/mobile` — aplicativo

```
src/
  app/                # rotas do Expo Router (file-based)
  components/         # design system: Button, Card, ProgressRing, Skeleton...
  features/           # uma pasta por feature, espelhando os módulos da API
    auth/ onboarding/ nutrition/ meals/ workouts/ progress/
  hooks/              # hooks reutilizáveis
  services/           # api client, storage, câmera, notificações
  store/              # Zustand: sessão, rascunho de onboarding, rascunho de refeição
  theme/              # tokens: cores, tipografia, espaçamento, sombras
```

Dentro de `features/<nome>/` ficam juntos: telas, componentes específicos daquela feature, hooks de dados (React Query) e mappers. Feature deletada = pasta deletada.

**Onde mora cada tipo de estado:**

| Tipo | Onde | Exemplo |
|---|---|---|
| Servidor | TanStack Query | refeições, planos, progresso |
| Sessão | Zustand + SecureStore | token, usuário atual |
| Rascunho de fluxo | Zustand | onboarding em andamento, análise antes de salvar |
| UI local | `useState` | modal aberto, aba selecionada |

Nada de estado de servidor duplicado num store global — é a fonte clássica de tela desatualizada.

---

## Camada de IA

```typescript
interface AIService {
  analyzeMealImage(input): Promise<MealAnalysisModelOutput>
  generateMealPlan(input): Promise<MealPlanModelOutput>
  generateWorkoutPlan(input): Promise<WorkoutPlanModelOutput>
  estimateNutrition(input): Promise<NutritionPer100>
}
```

Interface no domínio, implementação em `services/ai/providers/`. Trocar de provedor = escrever um adapter novo e mudar uma variável de ambiente.

Três regras que valem para toda chamada:

1. **O modelo nunca faz aritmética.** Ele devolve composição por 100 g + gramatura estimada; os totais são calculados por nós. Isso elimina uma classe inteira de erro, e permite recalcular quando o usuário corrige a porção — sem nova chamada, sem custo, sem latência.
2. **Todo output passa por Zod.** Falhou? Uma retentativa com a mensagem de erro anexada ao prompt. Falhou de novo? Erro tratado e caminho manual oferecido ao usuário. Nunca gravamos output não validado.
3. **Toda chamada é registrada** em `ai_usage_logs`: tokens, custo, latência, versão do prompt, se validou. Sem isso, investigar por que a conta triplicou vira arqueologia.

Prompts são versionados (`prompt_version` gravado junto do resultado). Mudar o prompt e não conseguir comparar antes/depois é como fazer deploy sem log.

---

## Decisões e seus custos

| Decisão | Ganho | Custo aceito |
|---|---|---|
| Monorepo npm workspaces | Contrato único entre app e API | Metro precisa de config de monorepo |
| Zustand + React Query | Menos boilerplate, cache correto | Duas bibliotecas de estado em vez de uma |
| Supabase (Auth + Storage + PG) | Um fornecedor, RLS pronto | Acoplamento a um fornecedor no Auth |
| REST + Zod compartilhado | Type-safety quase de tRPC, API pública | Escrever schema de rota à mão |
| Totais denormalizados em `meals` | Resumo diário = 1 leitura indexada | Recalcular em transação a cada escrita |
| Snapshot nutricional em `meal_foods` | Histórico imutável | Duplicação de dados |
| `NutritionTarget` versionada | Aderência histórica correta | Uma tabela a mais |

---

## Segurança

- **Autenticação**: JWT do Supabase validado no backend por assinatura (sem round-trip). Token no `expo-secure-store` (Keychain/Keystore), nunca em `AsyncStorage`.
- **Autorização**: todo repositório recebe `userId` do token — nunca do corpo da requisição. Toda query filtra por ele. `GET /meals/:id` de outro usuário retorna 404, não 403 (não confirmamos existência).
- **Fotos**: bucket privado, RLS por `owner`, path prefixado com o id do usuário. O backend acessa por signed URL de 5 minutos. Fotos são **dado pessoal sensível** sob a LGPD: consentimento explícito no onboarding e expurgo real no delete de conta.
- **Validação**: todo input passa por Zod na borda. Nada de `any`.
- **Rate limit**: global por IP + limite diário por usuário nas rotas de IA (as caras).
- **Erros**: handler global. Em produção, mensagem genérica + `requestId`; o detalhe vai para o log, não para o cliente.
