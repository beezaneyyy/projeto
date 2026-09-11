import { DISCLAIMERS } from '@nutrisnap/core';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useProfileStore } from '@/store/profile-store';
import { TRAINING_EXPERIENCE_LABELS, TRAINING_LOCATION_LABELS } from '@/lib/labels';

export default function WorkoutScreen() {
  const profile = useProfileStore((state) => state.profile);

  return (
    <Screen>
      <ThemedText type="subtitle">Treino</ThemedText>
      <Card>
        <ThemedText type="smallBold">Plano ainda não gerado</ThemedText>
        <ThemedText themeColor="textSecondary">
          A divisão de treino por nível, frequência e equipamento (docs/02-mvp.md, item 10) chega junto com a camada
          de IA do backend.
        </ThemedText>
        {profile ? (
          <ThemedText type="small" themeColor="textSecondary">
            Perfil salvo: {TRAINING_EXPERIENCE_LABELS[profile.experience]} · {TRAINING_LOCATION_LABELS[profile.location]} ·{' '}
            {profile.trainingDaysPerWeek}x/semana
          </ThemedText>
        ) : null}
      </Card>
      <ThemedText type="small" themeColor="textSecondary">
        {DISCLAIMERS.workoutPlan}
      </ThemedText>
    </Screen>
  );
}
