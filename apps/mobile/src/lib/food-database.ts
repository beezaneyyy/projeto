import type { FoodCategory, NutritionPer100, PreparationMethod } from '@nutrisnap/core';

/**
 * Base local de alimentos, valores aproximados (referencia TACO/IBGE).
 *
 * Provisoria: substitui a busca real (`GET /foods/search`) e a analise de IA
 * (`POST /meals/analyze-image`) enquanto o backend nao tem essas rotas. Serve
 * tanto a busca manual quanto o mock de analise por foto, para os dois
 * caminhos convergirem nos mesmos numeros.
 */
export interface FoodDefinition {
  readonly canonicalName: string;
  readonly name: string;
  readonly category: FoodCategory;
  readonly preparationMethod: PreparationMethod;
  readonly per100g: NutritionPer100;
  readonly defaultGrams: number;
}

export const FOOD_DATABASE: readonly FoodDefinition[] = [
  {
    canonicalName: 'arroz_branco_cozido',
    name: 'Arroz branco cozido',
    category: 'grain',
    preparationMethod: 'boiled',
    per100g: { calories: 128, protein: 2.5, carbs: 28.1, fat: 0.2, fiber: 0.4 },
    defaultGrams: 150,
  },
  {
    canonicalName: 'feijao_carioca_cozido',
    name: 'Feijão carioca cozido',
    category: 'legume',
    preparationMethod: 'boiled',
    per100g: { calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5 },
    defaultGrams: 100,
  },
  {
    canonicalName: 'peito_de_frango_grelhado',
    name: 'Peito de frango grelhado',
    category: 'protein',
    preparationMethod: 'grilled',
    per100g: { calories: 159, protein: 32, carbs: 0, fat: 2.5, fiber: 0 },
    defaultGrams: 120,
  },
  {
    canonicalName: 'ovo_cozido',
    name: 'Ovo cozido',
    category: 'protein',
    preparationMethod: 'boiled',
    per100g: { calories: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0 },
    defaultGrams: 50,
  },
  {
    canonicalName: 'brocolis_cozido',
    name: 'Brócolis cozido',
    category: 'vegetable',
    preparationMethod: 'boiled',
    per100g: { calories: 25, protein: 2.1, carbs: 4.4, fat: 0.3, fiber: 2.9 },
    defaultGrams: 80,
  },
  {
    canonicalName: 'batata_doce_cozida',
    name: 'Batata doce cozida',
    category: 'grain',
    preparationMethod: 'boiled',
    per100g: { calories: 77, protein: 1.3, carbs: 18.4, fat: 0.1, fiber: 2.2 },
    defaultGrams: 150,
  },
  {
    canonicalName: 'salada_verde',
    name: 'Salada verde (folhas)',
    category: 'vegetable',
    preparationMethod: 'raw',
    per100g: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.6 },
    defaultGrams: 60,
  },
  {
    canonicalName: 'pao_frances',
    name: 'Pão francês',
    category: 'grain',
    preparationMethod: 'baked',
    per100g: { calories: 300, protein: 8, carbs: 58.6, fat: 3.1, fiber: 2.3 },
    defaultGrams: 50,
  },
  {
    canonicalName: 'banana_prata',
    name: 'Banana prata',
    category: 'fruit',
    preparationMethod: 'raw',
    per100g: { calories: 98, protein: 1.3, carbs: 26, fat: 0.1, fiber: 2 },
    defaultGrams: 90,
  },
  {
    canonicalName: 'carne_bovina_grelhada',
    name: 'Carne bovina grelhada (patinho)',
    category: 'protein',
    preparationMethod: 'grilled',
    per100g: { calories: 219, protein: 35.9, carbs: 0, fat: 7.3, fiber: 0 },
    defaultGrams: 120,
  },
  {
    canonicalName: 'macarrao_cozido',
    name: 'Macarrão cozido',
    category: 'grain',
    preparationMethod: 'boiled',
    per100g: { calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8 },
    defaultGrams: 150,
  },
  {
    canonicalName: 'queijo_minas',
    name: 'Queijo minas frescal',
    category: 'dairy',
    preparationMethod: 'unknown',
    per100g: { calories: 264, protein: 17.4, carbs: 3.2, fat: 20.2, fiber: 0 },
    defaultGrams: 40,
  },
  {
    canonicalName: 'iogurte_natural',
    name: 'Iogurte natural',
    category: 'dairy',
    preparationMethod: 'unknown',
    per100g: { calories: 51, protein: 4.1, carbs: 4.9, fat: 1.5, fiber: 0 },
    defaultGrams: 170,
  },
  {
    canonicalName: 'abacate',
    name: 'Abacate',
    category: 'fruit',
    preparationMethod: 'raw',
    per100g: { calories: 96, protein: 1.2, carbs: 6, fat: 8.4, fiber: 6.3 },
    defaultGrams: 80,
  },
  {
    canonicalName: 'azeite_de_oliva',
    name: 'Azeite de oliva',
    category: 'fat_oil',
    preparationMethod: 'unknown',
    per100g: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
    defaultGrams: 10,
  },
  {
    canonicalName: 'aveia_em_flocos',
    name: 'Aveia em flocos',
    category: 'grain',
    preparationMethod: 'unknown',
    per100g: { calories: 394, protein: 13.9, carbs: 67, fat: 8.5, fiber: 9.1 },
    defaultGrams: 40,
  },
  {
    canonicalName: 'whey_protein',
    name: 'Whey protein (dose)',
    category: 'supplement',
    preparationMethod: 'unknown',
    per100g: { calories: 380, protein: 78, carbs: 8, fat: 6, fiber: 0 },
    defaultGrams: 30,
  },
  {
    canonicalName: 'tomate',
    name: 'Tomate',
    category: 'vegetable',
    preparationMethod: 'raw',
    per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
    defaultGrams: 60,
  },
  {
    canonicalName: 'batata_frita',
    name: 'Batata frita',
    category: 'ultra_processed',
    preparationMethod: 'deep_fried',
    per100g: { calories: 312, protein: 3.8, carbs: 40.9, fat: 15, fiber: 3.6 },
    defaultGrams: 120,
  },
  {
    canonicalName: 'refrigerante',
    name: 'Refrigerante',
    category: 'beverage',
    preparationMethod: 'unknown',
    per100g: { calories: 42, protein: 0, carbs: 10.5, fat: 0, fiber: 0 },
    defaultGrams: 300,
  },
] as const;

export function searchFoods(query: string): readonly FoodDefinition[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return FOOD_DATABASE;
  return FOOD_DATABASE.filter((food) => food.name.toLowerCase().includes(normalized));
}
