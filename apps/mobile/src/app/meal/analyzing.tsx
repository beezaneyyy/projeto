import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { analyzeMealPhoto } from '@/lib/mock-analysis';
import { useMealDraftStore } from '@/store/meal-draft-store';

export default function AnalyzingScreen() {
  const theme = useTheme();
  const photoUri = useMealDraftStore((state) => state.photoUri);
  const setFromAnalysis = useMealDraftStore((state) => state.setFromAnalysis);

  useEffect(() => {
    let cancelled = false;
    analyzeMealPhoto(photoUri ?? '').then((result) => {
      if (cancelled) return;
      setFromAnalysis(result);
      router.replace('/meal/confirm');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen withTabBarInset={false} style={styles.center}>
      <ActivityIndicator size="large" color={theme.primary} />
      <ThemedText type="smallBold" style={styles.text}>
        Analisando sua refeição...
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        Identificando alimentos e estimando porções
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  text: { textAlign: 'center' },
});
