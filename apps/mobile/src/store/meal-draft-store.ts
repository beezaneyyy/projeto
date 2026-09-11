import type { MealType, MeasureUnit, NutritionPer100, PortionSource, PreparationMethod } from '@nutrisnap/core';
import { create } from 'zustand';

import type { FoodDefinition } from '@/lib/food-database';
import type { MockAnalysisResult } from '@/lib/mock-analysis';

/**
 * Estado transiente de UMA refeicao em registro: foto -> analise -> confirmacao.
 *
 * Deliberadamente fora de `diary-store` (que e persistido): este rascunho
 * some se o usuario fechar o fluxo sem salvar, o diario nao deveria.
 */
export interface MealDraftItem {
  clientId: string;
  nameSnapshot: string;
  per100gSnapshot: NutritionPer100;
  preparationMethod: PreparationMethod;
  unit: MeasureUnit;
  grams: number;
  minGrams?: number;
  maxGrams?: number;
  aiEstimatedGrams?: number | null;
  aiConfidence?: number | null;
  portionSource: PortionSource;
}

interface MealDraftState {
  mealType: MealType;
  photoUri: string | null;
  items: MealDraftItem[];
  disclaimer: string | null;
  setMealType: (mealType: MealType) => void;
  setPhoto: (uri: string | null) => void;
  setFromAnalysis: (result: MockAnalysisResult) => void;
  updateGrams: (clientId: string, grams: number) => void;
  removeItem: (clientId: string) => void;
  addManualFood: (food: FoodDefinition, grams: number) => void;
  reset: () => void;
}

function itemFromFood(food: FoodDefinition, grams: number, portionSource: PortionSource): MealDraftItem {
  return {
    clientId: `manual-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    nameSnapshot: food.name,
    per100gSnapshot: food.per100g,
    preparationMethod: food.preparationMethod,
    unit: 'g',
    grams,
    portionSource,
  };
}

export const useMealDraftStore = create<MealDraftState>()((set) => ({
  mealType: 'lunch',
  photoUri: null,
  items: [],
  disclaimer: null,

  setMealType: (mealType) => set({ mealType }),
  setPhoto: (photoUri) => set({ photoUri }),

  setFromAnalysis: (result) =>
    set({
      disclaimer: result.disclaimer,
      mealType: result.suggestedMealType,
      items: result.foods.map((analyzed) => ({
        clientId: analyzed.clientId,
        nameSnapshot: analyzed.food.name,
        per100gSnapshot: analyzed.food.per100g,
        preparationMethod: analyzed.food.preparationMethod,
        unit: 'g',
        grams: analyzed.estimatedGrams,
        minGrams: analyzed.minGrams,
        maxGrams: analyzed.maxGrams,
        aiEstimatedGrams: analyzed.estimatedGrams,
        aiConfidence: analyzed.confidence,
        portionSource: 'ai_estimate',
      })),
    }),

  updateGrams: (clientId, grams) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.clientId === clientId
          ? {
              ...item,
              grams,
              portionSource:
                item.portionSource === 'ai_estimate' && grams !== item.aiEstimatedGrams
                  ? 'user_adjusted'
                  : item.portionSource,
            }
          : item,
      ),
    })),

  removeItem: (clientId) => set((state) => ({ items: state.items.filter((item) => item.clientId !== clientId) })),

  addManualFood: (food, grams) =>
    set((state) => ({ items: [...state.items, itemFromFood(food, grams, 'manual_entry')] })),

  reset: () => set({ mealType: 'lunch', photoUri: null, items: [], disclaimer: null }),
}));
