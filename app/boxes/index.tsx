import { Link, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SqliteBoxRepository } from '../../src/db';
import type { Box } from '../../src/domain';

export default function BoxesRoute() {
  const db = useSQLiteContext();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const repository = new SqliteBoxRepository(db);

      repository
        .list()
        .then((loadedBoxes) => {
          if (isActive) {
            setBoxes(loadedBoxes);
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

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.list}>
        {boxes.map((box) => (
          <Link key={box.id} href={{ pathname: '/boxes/[boxId]', params: { boxId: box.id } }} asChild>
            <Pressable style={styles.boxRow}>
              <View>
                <Text style={styles.boxTitle}>Box {box.number}</Text>
                {box.label ? <Text style={styles.boxLabel}>{box.label}</Text> : null}
              </View>
              <Text style={styles.chevron}>Open</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      {boxes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No boxes yet</Text>
          <Text style={styles.body}>Create the first box to start the catalog.</Text>
        </View>
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
