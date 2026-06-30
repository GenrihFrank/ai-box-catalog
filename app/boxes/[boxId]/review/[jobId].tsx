import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  SqliteBoxRepository,
  SqliteExtractionJobRepository,
  SqliteItemRepository
} from '../../../../src/db';
import {
  addManualItem,
  applyItemSuggestions,
  type Box,
  type ExtractionJob,
  type ItemSuggestion
} from '../../../../src/domain';

type SelectedSuggestions = Record<string, boolean>;
type EditedSuggestionNames = Record<string, string>;

export default function ReviewRoute() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { boxId, jobId } = useLocalSearchParams<{ boxId: string; jobId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [job, setJob] = useState<ExtractionJob | null>(null);
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<SelectedSuggestions>({});
  const [editedNames, setEditedNames] = useState<EditedSuggestionNames>({});
  const [missingItemName, setMissingItemName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReview = useCallback(async () => {
    const boxRepository = new SqliteBoxRepository(db);
    const extractionJobRepository = new SqliteExtractionJobRepository(db);
    const [loadedBox, loadedJob, loadedSuggestions] = await Promise.all([
      boxRepository.findById(boxId),
      extractionJobRepository.findById(jobId),
      extractionJobRepository.listSuggestions(jobId)
    ]);

    return { loadedBox, loadedJob, loadedSuggestions };
  }, [boxId, db, jobId]);

  function applyLoadedReview(
    loadedBox: Box | null,
    loadedJob: ExtractionJob | null,
    loadedSuggestions: ItemSuggestion[]
  ) {
    setBox(loadedBox);
    setJob(loadedJob);
    setSuggestions(loadedSuggestions);
    setEditedNames(Object.fromEntries(loadedSuggestions.map((suggestion) => [suggestion.id, suggestion.name])));
    setSelectedSuggestions(
      Object.fromEntries(
        loadedSuggestions
          .filter((suggestion) => isSuggestionActionable(suggestion))
          .map((suggestion) => [suggestion.id, suggestion.selectedByDefault])
      )
    );
    setErrorMessage(null);
    setIsLoaded(true);
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      loadReview()
        .then(({ loadedBox, loadedJob, loadedSuggestions }) => {
          if (isActive) {
            applyLoadedReview(loadedBox, loadedJob, loadedSuggestions);
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load review');
            setIsLoaded(true);
          }
        });

      return () => {
        isActive = false;
      };
    }, [loadReview])
  );

  async function refreshReview() {
    const { loadedBox, loadedJob, loadedSuggestions } = await loadReview();
    applyLoadedReview(loadedBox, loadedJob, loadedSuggestions);
  }

  async function handleRenameSuggestion(suggestionId: string) {
    const name = editedNames[suggestionId]?.trim();

    if (!name) {
      setErrorMessage('Suggestion name must not be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await new SqliteExtractionJobRepository(db).updateSuggestionName(
        suggestionId,
        name,
        new Date().toISOString()
      );
      await refreshReview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to rename suggestion');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSuggestion(suggestionId: string) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await new SqliteExtractionJobRepository(db).markSuggestionDeleted(suggestionId, new Date().toISOString());
      await refreshReview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete suggestion');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddMissingItem() {
    if (!missingItemName.trim()) {
      setErrorMessage('Missing item name must not be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await addManualItem(
        { boxId, name: missingItemName },
        { itemRepository: new SqliteItemRepository(db) }
      );
      setMissingItemName('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add missing item');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApplySelected(suggestionIds: string[]) {
    if (suggestionIds.length === 0) {
      setErrorMessage('Select at least one suggestion.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await applyItemSuggestions(
        { jobId, suggestionIds },
        {
          extractionJobRepository: new SqliteExtractionJobRepository(db),
          itemRepository: new SqliteItemRepository(db)
        }
      );
      router.replace({ pathname: '/boxes/[boxId]', params: { boxId } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to apply suggestions');
    } finally {
      setIsSaving(false);
    }
  }

  const actionableSuggestions = suggestions.filter(isSuggestionActionable);
  const selectedIds = actionableSuggestions
    .filter((suggestion) => selectedSuggestions[suggestion.id])
    .map((suggestion) => suggestion.id);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!isLoaded ? <Text style={styles.body}>Loading review...</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {isLoaded && (!box || !job) && !errorMessage ? (
        <>
          <Text style={styles.title}>Review not found</Text>
          <Text style={styles.body}>The extraction job is not available locally.</Text>
          <Link href="/boxes" style={styles.link}>
            Back to boxes
          </Link>
        </>
      ) : null}

      {box && job ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Review suggestions</Text>
            <Text style={styles.body}>Box {box.number}</Text>
            <Text style={styles.meta}>Status: {job.status}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || actionableSuggestions.length === 0}
              onPress={() => handleApplySelected(actionableSuggestions.map((suggestion) => suggestion.id))}
              style={[styles.primaryButton, isSaving || actionableSuggestions.length === 0 ? styles.disabledButton : null]}
            >
              <Text style={styles.primaryButtonText}>Add all</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || selectedIds.length === 0}
              onPress={() => handleApplySelected(selectedIds)}
              style={[styles.secondaryButton, isSaving || selectedIds.length === 0 ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>Add selected</Text>
            </Pressable>
          </View>

          <View style={styles.suggestionList}>
            {suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionRow}>
                <View style={styles.suggestionHeader}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!isSuggestionActionable(suggestion)}
                    onPress={() =>
                      setSelectedSuggestions((current) => ({
                        ...current,
                        [suggestion.id]: !current[suggestion.id]
                      }))
                    }
                    style={[
                      styles.selectButton,
                      selectedSuggestions[suggestion.id] ? styles.selectedButton : null,
                      !isSuggestionActionable(suggestion) ? styles.disabledButton : null
                    ]}
                  >
                    <Text style={selectedSuggestions[suggestion.id] ? styles.selectedButtonText : styles.selectButtonText}>
                      {selectedSuggestions[suggestion.id] ? 'Selected' : 'Select'}
                    </Text>
                  </Pressable>
                  <Text style={styles.statusText}>{suggestion.status}</Text>
                </View>
                <TextInput
                  value={editedNames[suggestion.id] ?? suggestion.name}
                  onChangeText={(name) =>
                    setEditedNames((current) => ({
                      ...current,
                      [suggestion.id]: name
                    }))
                  }
                  editable={isSuggestionActionable(suggestion)}
                  style={styles.input}
                />
                {suggestion.reason ? <Text style={styles.meta}>{suggestion.reason}</Text> : null}
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSaving || !isSuggestionActionable(suggestion)}
                    onPress={() => handleRenameSuggestion(suggestion.id)}
                  >
                    <Text style={styles.linkText}>Rename</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSaving || !isSuggestionActionable(suggestion)}
                    onPress={() => handleDeleteSuggestion(suggestion.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {suggestions.length === 0 ? <Text style={styles.body}>No suggestions returned.</Text> : null}

          <View style={styles.manualBlock}>
            <Text style={styles.sectionTitle}>Missing item</Text>
            <TextInput
              value={missingItemName}
              onChangeText={setMissingItemName}
              placeholder="Add missing item"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleAddMissingItem}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleAddMissingItem}
              style={[styles.secondaryButton, isSaving ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>Add manually</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function isSuggestionActionable(suggestion: ItemSuggestion): boolean {
  return suggestion.status === 'active' || suggestion.status === 'edited';
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 24,
    paddingBottom: 40
  },
  header: {
    gap: 4
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  body: {
    fontSize: 16
  },
  meta: {
    color: '#4b5563',
    fontSize: 13
  },
  actions: {
    gap: 10
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0b57d0',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center'
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
    minHeight: 48,
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  },
  suggestionList: {
    gap: 10
  },
  suggestionRow: {
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  suggestionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  selectButton: {
    borderColor: '#0b57d0',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  selectedButton: {
    backgroundColor: '#0b57d0'
  },
  selectButtonText: {
    color: '#0b57d0',
    fontSize: 14,
    fontWeight: '700'
  },
  selectedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  statusText: {
    color: '#4b5563',
    fontSize: 13,
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
  rowActions: {
    flexDirection: 'row',
    gap: 18
  },
  manualBlock: {
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  link: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '700'
  },
  linkText: {
    color: '#0b57d0',
    fontSize: 14,
    fontWeight: '700'
  },
  deleteText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700'
  },
  error: {
    color: '#b42318',
    fontSize: 14
  }
});
