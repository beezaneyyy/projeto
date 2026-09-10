import { z } from 'zod';
import { nutritionPer100Schema, preparationMethodSchema } from './ai.js';
import { mealTypeSchema, measureUnitSchema, planStatusSchema } from './enums.js';

/** Um alimento dentro de uma refeicao do plano. */
export const mealPlanItemSchema = z.object({
  id: z.string().uuid(),
  foodId: z.string().uuid().nullish(),
  name: z.string().trim().min(2).max(120),
  quantity: z.number().positive().max(5000),
  unit: measureUnitSchema,
  grams: z.number().positive().max(5000),
  per100g: nutritionPer100Schema,
  preparationMethod: preparationMethodSchema.default('unknown'),
  /** Alternativas equivalentes em calorias/macros, para o botao "trocar alimento". */
  substitutes: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        grams: z.number().positive().max(5000),
        per100g: nutritionPer100Schema,
      }),
    )
    .max(3)
    .default([]),
});
export type MealPlanItem = z.infer<typeof mealPlanItemSchema>;

export const mealPlanMealSchema = z.object({
  id: z.string().uuid(),
  mealType: mealTypeSchema,
  name: z.string().trim().min(2).max(80),
  /** Horario sugerido no formato HH:mm. */
  suggestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  items: z.array(mealPlanItemSchema).min(1).max(12),
  totals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
  }),
  preparationTip: z.string().trim().max(300).nullish(),
});
export type MealPlanMeal = z.infer<typeof mealPlanMealSchema>;

export const mealPlanDaySchema = z.object({
  id: z.string().uuid(),
  /** 0 = segunda-feira. */
  dayIndex: z.number().int().min(0).max(6),
  meals: z.array(mealPlanMealSchema).min(2).max(8),
  totals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
  }),
});
export type MealPlanDay = z.infer<typeof mealPlanDaySchema>;

export const mealPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  status: planStatusSchema,
  startsOn: z.string().date(),
  targetCalories: z.number().int().positive(),
  targetProtein: z.number().nonnegative(),
  targetCarbs: z.number().nonnegative(),
  targetFat: z.number().nonnegative(),
  days: z.array(mealPlanDaySchema).min(1).max(7),
  disclaimer: z.string(),
});
export type MealPlan = z.infer<typeof mealPlanSchema>;

/**
 * Output do modelo ao gerar o plano alimentar.
 *
 * Mesmo padrao da analise de foto: o modelo entrega composicao por 100 g e
 * gramatura; os totais de refeicao e de dia sao somados por nos. Um plano cujo
 * total nao bate com a meta e um bug visivel na primeira tela.
 */
export const mealPlanModelOutputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rationale: z.string().trim().max(500),
  days: z
    .array(
      z.object({
        dayIndex: z.number().int().min(0).max(6),
        meals: z
          .array(
            z.object({
              mealType: mealTypeSchema,
              name: z.string().trim().min(2).max(80),
              suggestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
              preparationTip: z.string().trim().max(300).nullish(),
              items: z
                .array(
                  z.object({
                    name: z.string().trim().min(2).max(120),
                    canonicalName: z.string().regex(/^[a-z0-9_]+$/).max(60),
                    grams: z.number().positive().max(5000),
                    unit: measureUnitSchema,
                    quantity: z.number().positive().max(5000),
                    per100g: nutritionPer100Schema,
                    preparationMethod: preparationMethodSchema,
                  }),
                )
                .min(1)
                .max(12),
            }),
          )
          .min(2)
          .max(8),
      }),
    )
    .min(1)
    .max(7),
});
export type MealPlanModelOutput = z.infer<typeof mealPlanModelOutputSchema>;

export const generateMealPlanRequestSchema = z.object({
  /** Quantos dias gerar. 1 = so hoje (rapido e barato), 7 = semana completa. */
  days: z.number().int().min(1).max(7).default(7),
  /** Regenera ignorando o plano ativo. */
  force: z.boolean().default(false),
  /** Pedido livre do usuario: "mais pratico", "sem repetir frango". */
  instructions: z.string().trim().max(300).nullish(),
});
export type GenerateMealPlanRequest = z.infer<typeof generateMealPlanRequestSchema>;

export const swapMealRequestSchema = z.object({
  reason: z.string().trim().max(200).nullish(),
  /** Trava alimentos que o usuario quer manter na refeicao. */
  keepItemIds: z.array(z.string().uuid()).max(12).default([]),
});
export type SwapMealRequest = z.infer<typeof swapMealRequestSchema>;
