import * as ImagePicker from 'expo-image-picker';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  SqliteBoxPhotoRepository,
  SqliteBoxRepository,
  SqliteExtractionJobRepository
} from '../../../src/db';
import { addBoxPhoto, startExtractionJob, type Box, type BoxPhoto } from '../../../src/domain';
import { mockExtractItemsFromPhotos } from '../../../src/services/extraction/mockExtractItemsFromPhotos';
import { prepareBoxPhotoAsset } from '../../../src/services/photos/prepareBoxPhotoAsset';

export default function BoxPhotosRoute() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { boxId } = useLocalSearchParams<{ boxId: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [photos, setPhotos] = useState<BoxPhoto[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    const boxRepository = new SqliteBoxRepository(db);
    const photoRepository = new SqliteBoxPhotoRepository(db);
    const [loadedBox, loadedPhotos] = await Promise.all([
      boxRepository.findById(boxId),
      photoRepository.listByBoxId(boxId)
    ]);

    return { loadedBox, loadedPhotos };
  }, [boxId, db]);

  function applyLoadedPhotos(loadedBox: Box | null, loadedPhotos: BoxPhoto[]) {
    setBox(loadedBox);
    setPhotos(loadedPhotos);
    setErrorMessage(null);
    setIsLoaded(true);
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      loadPhotos()
        .then(({ loadedBox, loadedPhotos }) => {
          if (isActive) {
            applyLoadedPhotos(loadedBox, loadedPhotos);
          }
        })
        .catch((error: unknown) => {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load photos');
            setIsLoaded(true);
          }
        });

      return () => {
        isActive = false;
      };
    }, [loadPhotos])
  );

  async function handleTakePhoto() {
    if (isSaving) {
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Camera permission was denied. You can still add photos from gallery.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        exif: true,
        mediaTypes: ['images'],
        quality: 1
      });

      if (!result.canceled) {
        await savePickedAssets(result.assets);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Camera is unavailable. Add photos from gallery.');
    }
  }

  async function handlePickFromGallery() {
    if (isSaving) {
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Gallery permission was denied.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        exif: true,
        mediaTypes: ['images'],
        quality: 1,
        selectionLimit: 3
      });

      if (!result.canceled) {
        await savePickedAssets(result.assets);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open gallery');
    }
  }

  async function savePickedAssets(assets: ImagePicker.ImagePickerAsset[]) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const photoRepository = new SqliteBoxPhotoRepository(db);

      for (const asset of assets) {
        const photoId = createPhotoId();
        const preparedAsset = await prepareBoxPhotoAsset(asset, boxId, photoId);
        await addBoxPhoto(
          {
            boxId,
            ...preparedAsset
          },
          {
            boxPhotoRepository: photoRepository,
            createId: () => photoId
          }
        );
      }

      const { loadedBox, loadedPhotos } = await loadPhotos();
      applyLoadedPhotos(loadedBox, loadedPhotos);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save photos');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunMockExtraction() {
    if (isSaving || isExtracting) {
      return;
    }

    if (photos.length === 0) {
      setErrorMessage('Add at least one photo before extraction.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const job = await startExtractionJob(
        {
          boxId,
          photoIds: photos.map((photo) => photo.id),
          mode: 'mock'
        },
        {
          boxPhotoRepository: new SqliteBoxPhotoRepository(db),
          extractionJobRepository: new SqliteExtractionJobRepository(db),
          extractItemsFromPhotos: mockExtractItemsFromPhotos
        }
      );

      router.push({ pathname: '/boxes/[boxId]/review/[jobId]', params: { boxId, jobId: job.id } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run extraction');
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!isLoaded ? <Text style={styles.body}>Loading photos...</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {isLoaded && !box && !errorMessage ? (
        <>
          <Text style={styles.title}>Box not found</Text>
          <Text style={styles.body}>Photos can only be added to a local box.</Text>
          <Link href="/boxes" style={styles.link}>
            Back to boxes
          </Link>
        </>
      ) : null}

      {box ? (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Box {box.number} photos</Text>
              <Text style={styles.body}>{photos.length} photos saved locally.</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleTakePhoto}
              style={[styles.primaryButton, isSaving ? styles.disabledButton : null]}
            >
              <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Take photo'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handlePickFromGallery}
              style={[styles.secondaryButton, isSaving ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>Add from gallery</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || isExtracting || photos.length === 0}
              onPress={handleRunMockExtraction}
              style={[styles.secondaryButton, isSaving || isExtracting || photos.length === 0 ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>{isExtracting ? 'Extracting...' : 'Run mock extraction'}</Text>
            </Pressable>
          </View>

          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.body}>Add 2-3 photos of this box before running extraction.</Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoTile}>
                  <Image source={{ uri: photo.thumbnailUri }} style={styles.thumbnail} />
                  <Text style={styles.meta}>
                    {photo.width}x{photo.height}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

function createPhotoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  body: {
    fontSize: 16
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  photoTile: {
    borderColor: '#d7dce2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 8,
    width: '48%'
  },
  thumbnail: {
    aspectRatio: 1,
    backgroundColor: '#eef2f6',
    borderRadius: 6,
    width: '100%'
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
  meta: {
    color: '#4b5563',
    fontSize: 12
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
