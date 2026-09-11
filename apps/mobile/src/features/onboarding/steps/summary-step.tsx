import { buildEnergyPlan, yearsSince } from '@nutrisnap/core';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { GOAL_LABELS } from '@/lib/labels';
import type { OnboardingDraft } from '@/store/profile-store';

interface SummaryStepProps {
  draft: OnboardingDraft;
  onConfirm: () => void;
}

export function SummaryStep({ draft, onConfirm }: SummaryStepProps) {
  const plan = useMemo(() => {
    if (!draft.sex || !draft.birthDate || !draft.heightCm || !draft.weightKg || !draft.goal || !draft.activityLevel) {
      return null;
    }
    return buildEnergyPlan({
      sex: draft.sex,
      ageYears: yearsSince(new Date(draft.birthDate)),
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      bodyFatPercentage: draft.bodyFatPercentage,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
      pace: draft.pace,
    });
  }, [draft]);

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Prontinho, {draft.displayName?.split(' ')[0]}</ThemedText>
      <ThemedText themeColor="textSecondary">
        Essa é sua meta calórica inicial. Você pode ajustar depois no seu perfil.
      </ThemedText>

      {plan ? (
        <Card>
          <ThemedText type="title" style={styles.calories}>
            {plan.calories.targetCalories} kcal/dia
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Objetivo: {GOAL_LABELS[draft.goal!]}
          </ThemedText>
          <View style={styles.macrosRow}>
            <MacroPreview label="Proteína" grams={plan.macros.protein.grams} color="protein" />
            <MacroPreview label="Carbo" grams={plan.macros.carbs.grams} color="carbs" />
            <MacroPreview label="Gordura" grams={plan.macros.fat.grams} color="fat" />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            TMB: {plan.bmr.bmr} kcal · TDEE: {plan.tdee.tdee} kcal
          </ThemedText>
        </Card>
      ) : (
        <ThemedText themeColor="danger">Faltam dados para calcular sua meta. Volte e revise os passos.</ThemedText>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {plan?.disclaimer}
      </ThemedText>

      <Button label="Concluir e começar" disabled={!plan} onPress={onConfirm} />
    </View>
  );
}

function MacroPreview({ label, grams, color }: { label: string; grams: number; color: 'protein' | 'carbs' | 'fat' }) {
  return (
    <View style={styles.macroItem}>
      <ThemedText type="smallBold" themeColor={color}>
        {grams}g
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  calories: { fontSize: 32, lineHeight: 38 },
  macrosRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.one },
  macroItem: { alignItems: 'center', gap: 2 },
});
