import { DISCLAIMERS } from '@nutrisnap/core';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

export default function PlanScreen() {
  return (
    <Screen>
      <ThemedText type="subtitle">Plano alimentar</ThemedText>
      <Card>
        <ThemedText type="smallBold">Ainda não gerado</ThemedText>
        <ThemedText themeColor="textSecondary">
          O plano de 7 dias, com troca e regeneração de refeições, chega quando a camada de IA do backend estiver
          pronta (docs/02-mvp.md, item 9).
        </ThemedText>
      </Card>
      <ThemedText type="small" themeColor="textSecondary">
        {DISCLAIMERS.mealPlan}
      </ThemedText>
    </Screen>
  );
}
