import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DiaryEntry,
  MealType,
  MeasureUnit,
  NutritionPer100,
  NutritionTotals,
  PortionSource,
  PreparationMethod,
} from '@nutrisnap/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LocalMealFood {
  clientId: string;
  nameSnapshot: string;
  per100gSnapshot: NutritionPer100;
  quantity: number;
  unit: MeasureUnit;
  grams: number;
  preparationMethod: PreparationMethod;
  portionSource: PortionSource;
  aiConfidence?: number | null;
  aiEstimatedGrams?: number | null;
  totals: NutritionTotals;
}

export interface LocalMeal {
  id: string;
  mealType: MealType;
  consumedAt: string;
  title?: string | null;
  photoUri?: string | null;
  foods: LocalMealFood[];
  totals: NutritionTotals;
}

interface DiaryState {
  mealsByDate: Record<string, LocalMeal[]>;
  addMeal: (dateKey: string, meal: LocalMeal) => void;
  removeMeal: (dateKey: string, mealId: string) => void;
}

/** Chave local do dia, `YYYY-MM-DD` no fuso do dispositivo (nao UTC). */
export function dateKeyFor(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      mealsByDate: {},

      addMeal: (dateKey, meal) =>
        set((state) => ({
          mealsByDate: {
            ...state.mealsByDate,
            [dateKey]: [...(state.mealsByDate[dateKey] ?? []), meal],
          },
        })),

      removeMeal: (dateKey, mealId) =>
        set((state) => ({
          mealsByDate: {
            ...state.mealsByDate,
            [dateKey]: (state.mealsByDate[dateKey] ?? []).filter((meal) => meal.id !== mealId),
          },
        })),
    }),
    {
      name: 'nutrisnap.diary',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function toDiaryEntries(meals: readonly LocalMeal[]): DiaryEntry[] {
  return meals.map((meal) => ({ mealType: meal.mealType, totals: meal.totals }));
}
