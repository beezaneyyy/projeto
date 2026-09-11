import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchFoods, type FoodDefinition } from '@/lib/food-database';
import { useMealDraftStore } from '@/store/meal-draft-store';

export default function SearchFoodScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const addManualFood = useMealDraftStore((state) => state.addManualFood);
  const items = useMealDraftStore((state) => state.items);

  const results = useMemo(() => searchFoods(query), [query]);
  const addedNames = useMemo(() => new Set(items.map((item) => item.nameSnapshot)), [items]);

  function handleAdd(food: FoodDefinition) {
    if (addedNames.has(food.name)) return;
    addManualFood(food, food.defaultGrams);
  }

  function handleDone() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/meal/confirm');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchBox}>
        <TextField
          label="Alimento"
          placeholder="Ex.: arroz, frango, banana..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.canonicalName}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const alreadyAdded = addedNames.has(item.name);
          return (
            <Pressable
              onPress={() => handleAdd(item)}
              style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.per100g.calories} kcal / 100g · porção padrão {item.defaultGrams}g
                </ThemedText>
              </View>
              <Ionicons
                name={alreadyAdded ? 'checkmark-circle' : 'add-circle-outline'}
                size={24}
                color={alreadyAdded ? theme.primary : theme.text}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Nenhum alimento encontrado.
          </ThemedText>
        }
      />

      <View style={styles.footer}>
        <Button label="Concluir" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { padding: Spacing.three },
  list: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  footer: { padding: Spacing.three },
});
