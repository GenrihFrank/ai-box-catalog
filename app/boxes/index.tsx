import { Link, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SqliteBoxPhotoRepository, SqliteBoxRepository, SqliteItemRepository } from '../../src/db';
import { searchItems, type Box, type BoxPhoto, type Item, type SearchResult } from '../../src/domain';

export default function BoxesRoute() {
  const db = useSQLiteContext();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [photos, setPhotos] = useState<BoxPhoto[]>([]);
  const [query, setQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const searchResults = trimmedQuery ? searchItems(trimmedQuery, items) : [];
  const boxesById = new Map(boxes.map((box) => [box.id, box]));
  const photosById = new Map(photos.map((photo) => [photo.id, photo]));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const boxRepository = new SqliteBoxRepository(db);
      const itemRepository = new SqliteItemRepository(db);
      const photoRepository = new SqliteBoxPhotoRepository(db);

      boxRepository
        .list()
        .then(async (loadedBoxes) => {
          const [loadedItems, photoGroups] = await Promise.all([
            itemRepository.listConfirmed(),
            Promise.all(loadedBoxes.map((box) => photoRepository.listByBoxId(box.id)))
          ]);

          return { loadedBoxes, loadedItems, loadedPhotos: photoGroups.flat() };
        })
        .then(({ loadedBoxes, loadedItems, loadedPhotos }) => {
          if (isActive) {
            setBoxes(loadedBoxes);
            setItems(loadedItems);
            setPhotos(loadedPhotos);
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
          accessibilityLabel="Search items input"
          value={query}
          onChangeText={setQuery}
          placeholder="Search items"
          style={styles.input}
          returnKeyType="search"
        />
      </View>

      {trimmedQuery ? (
        <SearchResults results={searchResults} boxesById={boxesById} photosById={photosById} />
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

function SearchResults({
  results,
  boxesById,
  photosById
}: {
  results: SearchResult[];
  boxesById: Map<string, Box>;
  photosById: Map<string, BoxPhoto>;
}) {
  if (results.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No candidates found</Text>
        <Text style={styles.body}>Only confirmed items are searched.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {results.map((result) => {
        const box = boxesById.get(result.boxId);
        const evidencePhotos = collectEvidencePhotos(result, photosById);

        if (!box) {
          return null;
        }

        return (
          <Link key={result.boxId} href={{ pathname: '/boxes/[boxId]', params: { boxId: result.boxId } }} asChild>
            <Pressable
              accessibilityLabel={`Open candidate box ${box.number}`}
              style={[styles.boxRow, styles.searchResultRow]}
            >
              <View style={styles.searchResultText}>
                <Text style={styles.boxTitle}>Candidate: Box {box.number}</Text>
                <Text style={styles.boxLabel}>Score {result.score}</Text>
                {result.matchedItems.map((item) => (
                  <View key={item.itemId} style={styles.matchedItemBlock}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.boxLabel}>Matched: {item.matchedTerms.join(', ')}</Text>
                  </View>
                ))}
                {evidencePhotos.length > 0 ? (
                  <View style={styles.evidenceList}>
                    {evidencePhotos.map((photo) => (
                      <Image key={photo.id} source={{ uri: photo.thumbnailUri }} style={styles.evidencePhoto} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.boxLabel}>No photo evidence.</Text>
                )}
              </View>
              <Text style={styles.chevron}>Open</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

function collectEvidencePhotos(result: SearchResult, photosById: Map<string, BoxPhoto>): BoxPhoto[] {
  const seenPhotoIds = new Set<string>();
  const evidencePhotos: BoxPhoto[] = [];

  for (const item of result.matchedItems) {
    for (const photoId of item.sourcePhotoIds) {
      if (seenPhotoIds.has(photoId)) {
        continue;
      }

      const photo = photosById.get(photoId);

      if (photo) {
        evidencePhotos.push(photo);
        seenPhotoIds.add(photoId);
      }
    }
  }

  return evidencePhotos;
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
  searchResultRow: {
    alignItems: 'flex-start'
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
  matchedItemBlock: {
    gap: 2,
    marginTop: 4
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700'
  },
  evidenceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  evidencePhoto: {
    aspectRatio: 1,
    backgroundColor: '#eef2f6',
    borderRadius: 6,
    width: 64
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
