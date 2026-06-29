import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SqliteBoxRepository } from '../../../src/db';
import type { Box } from '../../../src/domain';

export default function BoxRoute() {
  const db = useSQLiteContext();
  const { boxId } = useLocalSearchParams<{ boxId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const repository = new SqliteBoxRepository(db);

      repository
        .findById(boxId)
        .then((loadedBox) => {
          if (isActive) {
            setBox(loadedBox);
            setErrorMessage(null);
            setIsLoaded(true);
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
    }, [boxId, db])
  );

  return (
    <View style={styles.container}>
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
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24
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
  }
});
