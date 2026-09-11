import { Ionicons } from '@expo/vector-icons';
import { buildDailySummary } from '@nutrisnap/core';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MEAL_TYPE_LABELS } from '@/lib/labels';
import { dateKeyFor, toDiaryEntries, useDiaryStore } from '@/store/diary-store';
import { useProfileStore } from '@/store/profile-store';

export default function DiaryScreen() {
  const theme = useTheme();
  const energyPlan = useProfileStore((state) => state.energyPlan);
  const mealsByDate = useDiaryStore((state) => state.mealsByDate);

  const todayKey = dateKeyFor(new Date());
  const todayMeals = useMemo(() => mealsByDate[todayKey] ?? [], [mealsByDate, todayKey]);

  const summary = useMemo(() => {
    if (!energyPlan) return null;
    return buildDailySummary({
      date: todayKey,
      targets: {
        calories: energyPlan.macros.calories,
        protein: energyPlan.macros.protein.grams,
        carbs: energyPlan.macros.carbs.grams,
        fat: energyPlan.macros.fat.grams,
      },
      entries: toDiaryEntries(todayMeals),
    });
  }, [energyPlan, todayKey, todayMeals]);

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">Diário</ThemedText>
        {summary ? (
          <ThemedText themeColor="textSecondary">
            {Math.round(summary.consumed.calories)} / {summary.calories.target} kcal
          </ThemedText>
        ) : null}
      </View>

      {summary?.byMealType.map((bucket) => {
        const mealsOfType = todayMeals.filter((meal) => meal.mealType === bucket.mealType);
        return (
          <Card key={bucket.mealType}>
            <View style={styles.bucketHeader}>
              <ThemedText type="smallBold">{MEAL_TYPE_LABELS[bucket.mealType]}</ThemedText>
              <View style={styles.bucketRight}>
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round(bucket.totals.calories)} kcal
                </ThemedText>
                <Pressable
                  accessibilityLabel={`Adicionar em ${MEAL_TYPE_LABELS[bucket.mealType]}`}
                  onPress={() => router.push({ pathname: '/meal/capture', params: { mealType: bucket.mealType } })}
                  hitSlop={8}>
                  <Ionicons name="add-circle" color={theme.primary} size={22} />
                </Pressable>
              </View>
            </View>

            {mealsOfType.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nada registrado
              </ThemedText>
            ) : (
              mealsOfType.map((meal) => (
                <View key={meal.id} style={styles.mealItem}>
                  {meal.foods.map((food) => (
                    <ThemedText key={food.clientId} type="small">
                      {food.nameSnapshot} · {Math.round(food.grams)}g · {Math.round(food.totals.calories)} kcal
                    </ThemedText>
                  ))}
                </View>
              ))
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one },
  bucketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bucketRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mealItem: { gap: 2, paddingTop: Spacing.one },
});
