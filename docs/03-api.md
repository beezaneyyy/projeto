# API REST

Base: `/v1`. Todas as rotas exceto `/health` exigem `Authorization: Bearer <jwt>`.

## Autenticação e autorização

**Autenticação** acontece no Supabase Auth, no app. O backend só valida a assinatura do JWT (offline, sem round-trip) e extrai `sub` → `userId`.

**Autorização** é uniforme e não negociável: o `userId` vem do token, nunca do corpo ou da query. Todo repositório recebe `userId` e filtra por ele. Um recurso de outro usuário responde **404**, não 403 — 403 confirmaria que o recurso existe.

**Validação**: todo `body`, `params` e `query` passa por um schema Zod de `@nutrisnap/core` antes de chegar ao controller. Falha → `422` com a lista de campos.

### Códigos de erro

| Código | Quando |
|---|---|
| 400 | JSON malformado |
| 401 | Token ausente, expirado ou inválido |
| 404 | Não existe **ou** não é seu |
| 409 | Conflito de estado (ex.: treino já iniciado) |
| 422 | Falhou na validação Zod ou em regra de domínio (`DomainError`) |
| 429 | Rate limit |
| 502 | Provedor de IA indisponível ou devolveu output inválido após retentativa |

Corpo do erro:
```json
{ "error": { "code": "out_of_range", "message": "...", "details": {}, "requestId": "..." } }
```

---

## Endpoints

### Auth

| Método | Rota | Notas |
|---|---|---|
| POST | `/auth/bootstrap` | Cria a linha `User` local no primeiro acesso. Idempotente. |

> **Mudança em relação ao briefing:** `POST /auth/register` e `POST /auth/login` não existem. Com Supabase Auth, o app fala direto com o GoTrue — proxiar isso significaria reimplementar rotação de refresh token, com risco de segurança e nenhum ganho.

### Usuário

| Método | Rota | Notas |
|---|---|---|
| GET | `/users/me` | Perfil + meta vigente + status do onboarding |
| PUT | `/users/me` | Atualização parcial. Mudar peso/objetivo **encerra a meta atual e cria uma nova** `NutritionTarget` |
| POST | `/users/me/onboarding` | Recebe o perfil completo, calcula e persiste a primeira meta |
| DELETE | `/users/me` | Soft delete + job de expurgo (LGPD) |

### Nutrição

| Método | Rota | Notas |
|---|---|---|
| POST | `/nutrition/energy-plan` | TMB + TDEE + meta + macros em uma chamada. Sem efeito colateral — usado na prévia do onboarding |
| GET | `/nutrition/targets/current` | Meta vigente |
| GET | `/nutrition/daily-summary?date=YYYY-MM-DD` | Consumido, restante, por refeição. Compara com a meta **daquele dia** |

> `/nutrition/bmr` e `/nutrition/tdee` separados foram unificados em `/nutrition/energy-plan`. Duas chamadas encadeadas dobram a latência do onboarding e permitem estado inconsistente (TMB de um corpo, TDEE de outro).

### Refeições

| Método | Rota | Notas |
|---|---|---|
| POST | `/meals/photo-upload-url` | Devolve signed URL de escrita. **Rate limit por usuário** |
| POST | `/meals/analyze-image` | Recebe `storagePath`, chama a IA, devolve estimativa. **Não salva refeição** |
| POST | `/meals` | Salva o que o usuário confirmou |
| GET | `/meals?date=` ou `?from=&to=` | Cursor-based |
| GET | `/meals/:id` | |
| PUT | `/meals/:id` | Recalcula os totais em transação |
| DELETE | `/meals/:id` | |

**Por que analisar e salvar são separados:** a análise é uma sugestão; a refeição é um fato. Juntar os dois gravaria no diário um número que o usuário nunca confirmou.

### Alimentos

| Método | Rota | Notas |
|---|---|---|
| GET | `/foods?q=` | Busca por trigram. Verificados primeiro, depois os do usuário |
| GET | `/foods/:id` | |
| POST | `/foods` | Alimento privado do usuário (`source: user`) |

### Plano alimentar

| Método | Rota | Notas |
|---|---|---|
| POST | `/meal-plans/generate` | **Assíncrono**: responde 202 com `planId` e status `generating` |
| GET | `/meal-plans/current` | |
| POST | `/meal-plans/:planId/meals/:mealId/swap` | Troca uma refeição sem regenerar o plano |
| PUT | `/meal-plans/:planId/items/:itemId` | Ajusta quantidade |

> Gerar 7 dias leva 20–40 s. Segurar uma conexão HTTP nisso é receita para timeout de gateway. O app faz polling ou escuta Realtime.

### Treino

| Método | Rota | Notas |
|---|---|---|
| POST | `/workout-plans/generate` | 202, mesmo padrão |
| GET | `/workout-plans/current` | |
| GET | `/workouts/:id` | Prescrição + último log de cada exercício (para sugerir carga) |
| POST | `/workouts/:id/start` | Cria `WorkoutLog`. 409 se já houver um em andamento |
| POST | `/workouts/:id/complete` | Fecha, calcula volume total |
| POST | `/exercises/:workoutExerciseId/log` | Registra as séries. **Idempotente por `(workoutLogId, workoutExerciseId)`** |

> Idempotência aqui não é luxo: academia tem sinal ruim, e o app vai reenviar.

### Progresso

| Método | Rota | Notas |
|---|---|---|
| GET | `/progress?metric=&from=&to=&granularity=` | Séries + aderência + streak |
| POST | `/progress/logs` | Upsert por `(userId, metric, measuredOn)` |
| DELETE | `/progress/logs/:id` | |

---

## Rate limiting

| Escopo | Limite | Motivo |
|---|---|---|
| Global por IP | 120/min | Abuso genérico |
| `/meals/analyze-image` | 30/dia por usuário | Cada chamada custa dinheiro real |
| `/meal-plans/generate`, `/workout-plans/generate` | 5/dia por usuário | Chamadas longas e caras |
| `/foods?q=` | 60/min por usuário | Busca a cada tecla digitada |
