import { DISCLAIMERS, round, scaleNutritionByGrams, sumNutrition, type MealType } from '@nutrisnap/core';

import { FOOD_DATABASE, type FoodDefinition } from './food-database';

/**
 * Substitui `POST /meals/analyze-image` enquanto a camada de IA do backend
 * nao existe (ver docs/02-mvp.md, item 5). Sorteia 2-4 alimentos da base local
 * e usa `scaleNutritionByGrams` do dominio - o MESMO calculo que a analise
 * real vai usar - para que trocar este mock pela chamada de verdade nao mude
 * a forma dos dados que o resto do app consome.
 */
export interface MockAnalyzedFood {
  readonly clientId: string;
  readonly food: FoodDefinition;
  readonly estimatedGrams: number;
  readonly minGrams: number;
  readonly maxGrams: number;
  readonly confidence: number;
}

export interface MockAnalysisResult {
  readonly foods: readonly MockAnalyzedFood[];
  readonly suggestedMealType: MealType;
  readonly disclaimer: string;
  readonly imageQuality: 'good' | 'fair';
}

function suggestMealTypeFromHour(hour: number): MealType {
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 12) return 'morning_snack';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'afternoon_snack';
  if (hour >= 18 && hour < 21) return 'dinner';
  return 'supper';
}

function pickRandom<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

let clientIdCounter = 0;
function nextClientId(): string {
  clientIdCounter += 1;
  return `mock-${Date.now()}-${clientIdCounter}`;
}

/** Simula a latencia e o resultado de uma chamada de analise de foto. */
export function analyzeMealPhoto(_photoUri: string): Promise<MockAnalysisResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const itemCount = 2 + Math.floor(Math.random() * 3); // 2-4 itens
      const picked = pickRandom(FOOD_DATABASE, itemCount);

      const foods: MockAnalyzedFood[] = picked.map((food) => {
        const jitter = 0.85 + Math.random() * 0.3; // +-15%
        const estimatedGrams = round(food.defaultGrams * jitter);
        return {
          clientId: nextClientId(),
          food,
          estimatedGrams,
          minGrams: round(estimatedGrams * 0.7),
          maxGrams: round(estimatedGrams * 1.3),
          confidence: round(0.6 + Math.random() * 0.35, 2),
        };
      });

      resolve({
        foods,
        suggestedMealType: suggestMealTypeFromHour(new Date().getHours()),
        disclaimer: DISCLAIMERS.photoAnalysis,
        imageQuality: Math.random() > 0.2 ? 'good' : 'fair',
      });
    }, 1600);
  });
}

export function totalsForGrams(food: FoodDefinition, grams: number) {
  return scaleNutritionByGrams(food.per100g, grams);
}

export function sumMockTotals(items: readonly { food: FoodDefinition; grams: number }[]) {
  return sumNutrition(items.map((item) => totalsForGrams(item.food, item.grams)));
}
