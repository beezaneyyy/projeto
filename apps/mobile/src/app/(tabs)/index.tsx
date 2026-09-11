import { buildDailySummary } from '@nutrisnap/core';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CalorieRing } from '@/components/ui/calorie-ring';
import { Card } from '@/components/ui/card';
import { MacroBar } from '@/components/ui/macro-bar';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { MEAL_TYPE_LABELS } from '@/lib/labels';
import { dateKeyFor, toDiaryEntries, useDiaryStore } from '@/store/diary-store';
import { useProfileStore } from '@/store/profile-store';

export default function HomeScreen() {
  const profile = useProfileStore((state) => state.profile);
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
        fiber: energyPlan.macros.fiberGrams,
      },
      entries: toDiaryEntries(todayMeals),
    });
  }, [energyPlan, todayKey, todayMeals]);

  const recentMeals = [...todayMeals].reverse().slice(0, 3);

  return (
    <Screen>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Olá,
        </ThemedText>
        <ThemedText type="subtitle">{profile?.displayName ?? ''}</ThemedText>
      </View>

      {summary ? (
        <>
          <Card style={styles.ringCard}>
            <CalorieRing consumed={summary.calories.consumed} target={summary.calories.target} />
          </Card>

          <Card>
            <MacroBar label="Proteína" consumed={summary.protein.consumed} target={summary.protein.target} color="protein" />
            <MacroBar label="Carboidrato" consumed={summary.carbs.consumed} target={summary.carbs.target} color="carbs" />
            <MacroBar label="Gordura" consumed={summary.fat.consumed} target={summary.fat.target} color="fat" />
          </Card>
        </>
      ) : null}

      <Card>
        <ThemedText type="smallBold">Próximo treino</ThemedText>
        <ThemedText themeColor="textSecondary">
          O plano de treino ainda não foi gerado. Em breve por aqui.
        </ThemedText>
      </Card>

      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold">Últimas refeições</ThemedText>
        <ThemedText type="link" themeColor="primary" onPress={() => router.push('/(tabs)/diary')}>
          Ver diário
        </ThemedText>
      </View>

      {recentMeals.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">
            Nenhuma refeição registrada hoje. Toque no botão da câmera para começar.
          </ThemedText>
        </Card>
      ) : (
        recentMeals.map((meal) => (
          <Card key={meal.id} style={styles.mealRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{meal.title ?? MEAL_TYPE_LABELS[meal.mealType]}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {MEAL_TYPE_LABELS[meal.mealType]} · {meal.foods.length} itens
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{Math.round(meal.totals.calories)} kcal</ThemedText>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ringCard: { alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
