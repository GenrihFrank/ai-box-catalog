import { Link, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SqliteBoxRepository, SqliteItemRepository } from '../../src/db';
import { searchItems, type Box, type Item, type SearchResult } from '../../src/domain';

export default function BoxesRoute() {
  const db = useSQLiteContext();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const searchResults = trimmedQuery ? searchItems(trimmedQuery, items) : [];
  const boxesById = new Map(boxes.map((box) => [box.id, box]));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const boxRepository = new SqliteBoxRepository(db);
      const itemRepository = new SqliteItemRepository(db);

      Promise.all([boxRepository.list(), itemRepository.listConfirmed()])
        .then(([loadedBoxes, loadedItems]) => {
          if (isActive) {
            setBoxes(loadedBoxes);
            setItems(loadedItems);
            setErrorMessage(null);
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load boxes');
          }
        });

      return () => {
        isActive = false;
      };
    }, [db])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Boxes</Text>
          <Text style={styles.body}>
            {boxes.length === 0 ? 'No boxes yet.' : `${boxes.length} boxes in local catalog.`}
          </Text>
        </View>
        <Link href="/boxes/new" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>New</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/qr/scan" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Scan QR</Text>
        </Pressable>
      </Link>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search items"
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      {trimmedQuery ? (
        <SearchResults results={searchResults} boxesById={boxesById} />
      ) : (
        <View style={styles.list}>
          {boxes.map((box) => (
            <BoxRow key={box.id} box={box} />
          ))}
        </View>
      )}

      {!trimmedQuery && boxes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No boxes yet</Text>
          <Text style={styles.body}>Create the first box to start the catalog.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function SearchResults({ results, boxesById }: { results: SearchResult[]; boxesById: Map<string, Box> }) {
  if (results.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No confirmed item found</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {results.map((result) => {
        const box = boxesById.get(result.boxId);

        if (!box) {
          return null;
        }

        return (
          <Link key={result.boxId} href={{ pathname: '/boxes/[boxId]', params: { boxId: result.boxId } }} asChild>
            <Pressable style={styles.boxRow}>
              <View style={styles.searchResultText}>
                <Text style={styles.boxTitle}>Box {box.number}</Text>
                <Text style={styles.boxLabel}>
                  {result.matchedItems.map((item) => item.name).join(', ')}
                </Text>
              </View>
              <Text style={styles.chevron}>Open</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

function BoxRow({ box }: { box: Box }) {
  return (
    <Link href={{ pathname: '/boxes/[boxId]', params: { boxId: box.id } }} asChild>
      <Pressable style={styles.boxRow}>
        <View>
          <Text style={styles.boxTitle}>Box {box.number}</Text>
          {box.label ? <Text style={styles.boxLabel}>{box.label}</Text> : null}
        </View>
        <Text style={styles.chevron}>Open</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 24,
    paddingBottom: 40
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  body: {
    fontSize: 16
  },
  searchBox: {
    gap: 6
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#0b57d0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '700'
  },
  list: {
    gap: 10
  },
  boxRow: {
    alignItems: 'center',
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    padding: 16
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  boxLabel: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 4
  },
  searchResultText: {
    flex: 1,
    gap: 4
  },
  chevron: {
    color: '#0b57d0',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyState: {
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  error: {
    color: '#b42318',
    fontSize: 14
  }
});
