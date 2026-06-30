import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SqliteBoxRepository } from '../../src/db';
import { createBox } from '../../src/domain';

export default function NewBoxRoute() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreateBox() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const box = await createBox(
        { label: label.trim() || undefined },
        { boxRepository: new SqliteBoxRepository(db) }
      );
      router.replace({ pathname: '/boxes/[boxId]', params: { boxId: box.id } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create box');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New box</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Label</Text>
        <TextInput
          accessibilityLabel="Box label input"
          value={label}
          onChangeText={setLabel}
          placeholder="Winter clothes"
          style={styles.input}
          returnKeyType="done"
        />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        accessibilityLabel="Create box button"
        accessibilityRole="button"
        disabled={isSaving}
        onPress={handleCreateBox}
        style={[styles.primaryButton, isSaving ? styles.disabledButton : null]}
      >
        <Text style={styles.primaryButtonText}>{isSaving ? 'Creating...' : 'Create box'}</Text>
      </Pressable>
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
  field: {
    gap: 6
  },
  label: {
    fontSize: 14,
    fontWeight: '700'
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
  error: {
    color: '#b42318',
    fontSize: 14
  }
});
