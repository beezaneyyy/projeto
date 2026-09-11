import { DISCLAIMERS } from '@nutrisnap/core';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { ACTIVITY_LEVEL_LABELS, GOAL_LABELS, SEX_LABELS } from '@/lib/labels';
import { useProfileStore } from '@/store/profile-store';

export default function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const energyPlan = useProfileStore((state) => state.energyPlan);
  const resetProfile = useProfileStore((state) => state.resetProfile);

  if (!profile || !energyPlan) return null;

  function handleRedoOnboarding() {
    Alert.alert('Refazer questionário', 'Isso vai apagar seus dados de perfil atuais. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Refazer',
        style: 'destructive',
        onPress: () => {
          resetProfile();
          router.replace('/onboarding');
        },
      },
    ]);
  }

  return (
    <Screen>
      <ThemedText type="subtitle">{profile.displayName}</ThemedText>

      <Card>
        <ThemedText type="smallBold">Dados</ThemedText>
        <Row label="Sexo" value={SEX_LABELS[profile.sex]} />
        <Row label="Altura" value={`${profile.heightCm} cm`} />
        <Row label="Peso" value={`${profile.weightKg} kg`} />
        <Row label="Objetivo" value={GOAL_LABELS[profile.goal]} />
        <Row label="Nível de atividade" value={ACTIVITY_LEVEL_LABELS[profile.activityLevel]} />
      </Card>

      <Card>
        <ThemedText type="smallBold">Metas calculadas</ThemedText>
        <Row label="TMB" value={`${energyPlan.bmr.bmr} kcal`} />
        <Row label="TDEE" value={`${energyPlan.tdee.tdee} kcal`} />
        <Row label="Meta diária" value={`${energyPlan.calories.targetCalories} kcal`} />
        <Row label="Proteína" value={`${energyPlan.macros.protein.grams} g`} />
        <Row label="Carboidrato" value={`${energyPlan.macros.carbs.grams} g`} />
        <Row label="Gordura" value={`${energyPlan.macros.fat.grams} g`} />
      </Card>

      <ThemedText type="small" themeColor="textSecondary">
        {DISCLAIMERS.energyEstimate}
      </ThemedText>

      <Button label="Refazer questionário" variant="secondary" onPress={handleRedoOnboarding} />

      <ThemedText type="small" themeColor="textSecondary">
        Exclusão de conta (LGPD) chega junto com o backend de autenticação (docs/02-mvp.md, item 13).
      </ThemedText>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.half },
});
