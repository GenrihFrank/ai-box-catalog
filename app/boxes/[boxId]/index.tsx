import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SqliteBoxRepository, SqliteItemRepository } from '../../../src/db';
import { addManualItem, deleteItem, type Box, type Item } from '../../../src/domain';

export default function BoxRoute() {
  const db = useSQLiteContext();
  const { boxId } = useLocalSearchParams<{ boxId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBoxData = useCallback(async () => {
    const boxRepository = new SqliteBoxRepository(db);
    const itemRepository = new SqliteItemRepository(db);
    const [loadedBox, loadedItems] = await Promise.all([
      boxRepository.findById(boxId),
      itemRepository.listByBoxId(boxId)
    ]);

    return { loadedBox, loadedItems };
  }, [boxId, db]);

  function applyLoadedBox(loadedBox: Box | null, loadedItems: Item[]) {
    setBox(loadedBox);
    setItems(loadedItems);
    setErrorMessage(null);
    setIsLoaded(true);
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      loadBoxData()
        .then(({ loadedBox, loadedItems }) => {
          if (isActive) {
            applyLoadedBox(loadedBox, loadedItems);
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load box');
            setIsLoaded(true);
          }
        });

      return () => {
        isActive = false;
      };
    }, [loadBoxData])
  );

  async function handleAddItem() {
    if (isSavingItem) {
      return;
    }

    setIsSavingItem(true);
    setErrorMessage(null);

    try {
      await addManualItem(
        { boxId, name: newItemName },
        { itemRepository: new SqliteItemRepository(db) }
      );
      setNewItemName('');
      const { loadedBox, loadedItems } = await loadBoxData();
      applyLoadedBox(loadedBox, loadedItems);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add item');
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setErrorMessage(null);

    try {
      await deleteItem({ id: itemId }, { itemRepository: new SqliteItemRepository(db) });
      const { loadedBox, loadedItems } = await loadBoxData();
      applyLoadedBox(loadedBox, loadedItems);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete item');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!isLoaded ? <Text style={styles.body}>Loading box...</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {isLoaded && !box && !errorMessage ? (
        <>
          <Text style={styles.title}>Box not found</Text>
          <Text style={styles.body}>The QR or link points to a missing local box.</Text>
          <Link href="/boxes" style={styles.link}>
            Back to boxes
          </Link>
        </>
      ) : null}

      {box ? (
        <>
          <Text style={styles.title}>Box {box.number}</Text>
          {box.label ? <Text style={styles.body}>{box.label}</Text> : null}
          <Text style={styles.meta}>Stable ID: {box.id}</Text>

          <View style={styles.addItemForm}>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Add item"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isSavingItem}
              onPress={handleAddItem}
              style={[styles.primaryButton, isSavingItem ? styles.disabledButton : null]}
            >
              <Text style={styles.primaryButtonText}>{isSavingItem ? 'Adding...' : 'Add'}</Text>
            </Pressable>
          </View>

          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Pressable accessibilityRole="button" onPress={() => handleDeleteItem(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {items.length === 0 ? <Text style={styles.body}>No items yet.</Text> : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 24,
    paddingBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  body: {
    fontSize: 16
  },
  meta: {
    color: '#4b5563',
    fontSize: 13
  },
  link: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '700'
  },
  error: {
    color: '#b42318',
    fontSize: 14
  },
  addItemForm: {
    gap: 8
  },
  input: {
    borderColor: '#c7cdd4',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b57d0',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center'
  },
  disabledButton: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  itemsList: {
    gap: 8
  },
  itemRow: {
    alignItems: 'center',
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    padding: 14
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600'
  },
  deleteText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700'
  }
});
