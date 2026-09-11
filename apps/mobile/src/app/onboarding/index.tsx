import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { StepDots } from '@/components/ui/step-dots';
import { ActivityStep } from '@/features/onboarding/steps/activity-step';
import { GoalStep } from '@/features/onboarding/steps/goal-step';
import { PhysicalStep } from '@/features/onboarding/steps/physical-step';
import { PreferencesStep } from '@/features/onboarding/steps/preferences-step';
import { SummaryStep } from '@/features/onboarding/steps/summary-step';
import { TrainingStep } from '@/features/onboarding/steps/training-step';
import { Spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/profile-store';

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const draft = useProfileStore((state) => state.draft);
  const updateDraft = useProfileStore((state) => state.updateDraft);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

  function goNext<T extends Record<string, unknown>>(values: T) {
    updateDraft(values);
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  function handleConfirm() {
    completeOnboarding();
    router.replace('/');
  }

  return (
    <Screen withTabBarInset={false}>
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={goBack} hitSlop={12}>
            <ThemedText themeColor="primary">Voltar</ThemedText>
          </Pressable>
        ) : (
          <View />
        )}
        <StepDots total={TOTAL_STEPS} current={step} />
        <View style={{ width: 44 }} />
      </View>

      {step === 0 && <PhysicalStep draft={draft} onNext={goNext} />}
      {step === 1 && <GoalStep draft={draft} onNext={goNext} />}
      {step === 2 && <ActivityStep draft={draft} onNext={goNext} />}
      {step === 3 && <TrainingStep draft={draft} onNext={goNext} />}
      {step === 4 && <PreferencesStep draft={draft} onNext={goNext} />}
      {step === 5 && <SummaryStep draft={draft} onConfirm={handleConfirm} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
});
