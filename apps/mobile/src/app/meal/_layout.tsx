import { Stack } from 'expo-router';

export default function MealLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="capture" options={{ title: 'Registrar refeição' }} />
      <Stack.Screen
        name="analyzing"
        options={{ title: 'Analisando', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="confirm" options={{ title: 'Confirmar refeição' }} />
      <Stack.Screen name="search" options={{ title: 'Buscar alimento' }} />
    </Stack>
  );
}
