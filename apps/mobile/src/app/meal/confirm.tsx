import { Ionicons } from '@expo/vector-icons';
import { scaleNutritionByGrams, sumNutrition, type MealType } from '@nutrisnap/core';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MEAL_TYPE_LABELS } from '@/lib/labels';
import { dateKeyFor, useDiaryStore, type LocalMeal } from '@/store/diary-store';
import { useMealDraftStore, type MealDraftItem } from '@/store/meal-draft-store';

export default function ConfirmScreen() {
  const theme = useTheme();
  const mealType = useMealDraftStore((state) => state.mealType);
  const setMealType = useMealDraftStore((state) => state.setMealType);
  const items = useMealDraftStore((state) => state.items);
  const photoUri = useMealDraftStore((state) => state.photoUri);
  const disclaimer = useMealDraftStore((state) => state.disclaimer);
  const updateGrams = useMealDraftStore((state) => state.updateGrams);
  const removeItem = useMealDraftStore((state) => state.removeItem);
  const resetDraft = useMealDraftStore((state) => state.reset);
  const addMeal = useDiaryStore((state) => state.addMeal);

  const totals = useMemo(
    () => sumNutrition(items.map((item) => scaleNutritionByGrams(item.per100gSnapshot, item.grams))),
    [items],
  );

  function handleSave() {
    if (items.length === 0) {
      Alert.alert('Nada para salvar', 'Adicione ao menos um alimento antes de salvar.');
      return;
    }

    const meal: LocalMeal = {
      id: `meal-${Date.now()}`,
      mealType,
      consumedAt: new Date().toISOString(),
      photoUri,
      foods: items.map((item) => ({
        clientId: item.clientId,
        nameSnapshot: item.nameSnapshot,
        per100gSnapshot: item.per100gSnapshot,
        quantity: item.grams,
        unit: item.unit,
        grams: item.grams,
        preparationMethod: item.preparationMethod,
        portionSource: item.portionSource,
        aiConfidence: item.aiConfidence,
        aiEstimatedGrams: item.aiEstimatedGrams,
        totals: scaleNutritionByGrams(item.per100gSnapshot, item.grams),
      })),
      totals,
    };

    addMeal(dateKeyFor(new Date()), meal);
    resetDraft();
    router.dismissAll();
    router.push('/(tabs)/diary');
  }

  return (
    <Screen withTabBarInset={false}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" /> : null}

      <View style={styles.mealTypeRow}>
        {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((option) => (
          <Chip
            key={option}
            label={MEAL_TYPE_LABELS[option]}
            selected={mealType === option}
            onPress={() => setMealType(option)}
          />
        ))}
      </View>

      {items.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">Nenhum alimento ainda.</ThemedText>
        </Card>
      ) : (
        items.map((item) => (
          <FoodRow
            key={item.clientId}
            item={item}
            onChangeGrams={(grams) => updateGrams(item.clientId, grams)}
            onRemove={() => removeItem(item.clientId)}
          />
        ))
      )}

      <Pressable onPress={() => router.push('/meal/search')} style={styles.addRow}>
        <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
        <ThemedText type="link" themeColor="primary">
          Adicionar alimento
        </ThemedText>
      </Pressable>

      <Card style={styles.totalsCard}>
        <ThemedText type="smallBold">Total</ThemedText>
        <ThemedText type="title" style={styles.totalCalories}>
          {Math.round(totals.calories)} kcal
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · G {Math.round(totals.fat)}g
        </ThemedText>
      </Card>

      {disclaimer ? (
        <ThemedText type="small" themeColor="textSecondary">
          {disclaimer}
        </ThemedText>
      ) : null}

      <Button label="Salvar refeição" onPress={handleSave} />
    </Screen>
  );
}

function FoodRow({
  item,
  onChangeGrams,
  onRemove,
}: {
  item: MealDraftItem;
  onChangeGrams: (grams: number) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const totals = scaleNutritionByGrams(item.per100gSnapshot, item.grams);
  const hasRange = item.minGrams !== undefined && item.maxGrams !== undefined && item.aiEstimatedGrams !== undefined;

  return (
    <Card>
      <View style={styles.foodHeader}>
        <ThemedText type="smallBold" style={{ flex: 1 }}>
          {item.nameSnapshot}
        </ThemedText>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </Pressable>
      </View>

      {hasRange ? (
        <View style={styles.portionRow}>
          <Chip label="P" selected={item.grams === item.minGrams} onPress={() => onChangeGrams(item.minGrams!)} />
          <Chip
            label="M"
            selected={item.grams === item.aiEstimatedGrams}
            onPress={() => onChangeGrams(item.aiEstimatedGrams!)}
          />
          <Chip label="G" selected={item.grams === item.maxGrams} onPress={() => onChangeGrams(item.maxGrams!)} />
        </View>
      ) : null}

      <View style={styles.gramsRow}>
        <TextInput
          keyboardType="numeric"
          value={String(item.grams)}
          onChangeText={(value) => onChangeGrams(Number(value.replace(/[^0-9]/g, '')) || 0)}
          style={[styles.gramsInput, { color: theme.text, borderColor: theme.border }]}
        />
        <ThemedText themeColor="textSecondary"> g</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.calorieText}>
          {Math.round(totals.calories)} kcal
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: 16 },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, justifyContent: 'center' },
  totalsCard: { alignItems: 'center' },
  totalCalories: { fontSize: 30, lineHeight: 36 },
  foodHeader: { flexDirection: 'row', alignItems: 'center' },
  portionRow: { flexDirection: 'row', gap: Spacing.two },
  gramsRow: { flexDirection: 'row', alignItems: 'center' },
  gramsInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    width: 70,
    fontSize: 16,
  },
  calorieText: { marginLeft: 'auto' },
});
