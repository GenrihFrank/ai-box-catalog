# Android MVP Plan: AI Box Catalog

Generated on 2026-06-29
Status: APPROVED
Primary target: Android
Future target: iOS
Architecture reference: [architecture.md](./architecture.md)

## Summary

Build an Android-first mobile app for AI Box Catalog using React Native and Expo,
while keeping the architecture portable to iOS.

The MVP lets the user create boxes, add items manually or from photos, review model
suggestions, and search for things like `черные перчатки` with box and photo evidence.

Chosen stack:

- Mobile: React Native, Expo, TypeScript
- Navigation: expo-router
- Local DB: expo-sqlite
- Photos/files: expo-camera, expo-image-picker, expo-image-manipulator,
  expo-file-system
- QR: react-native-qrcode-svg, scanning through expo-camera
- Backend adapter: Node.js, TypeScript, Fastify, Zod
- Item extraction: extractItemsFromPhotos adapter, starting with mock, then
  local-desktop-vlm
- Tests: Vitest for domain logic, Maestro for Android E2E

## Implementation Plan

### 1. Mobile App Foundation

- Create an Expo app with TypeScript.
- Configure expo-router routes:
  - `/boxes`
  - `/boxes/[boxId]`
  - `/qr/[boxId]`
  - `/boxes/[boxId]/review/[jobId]`
- Add SQLite schema for:
  - boxes
  - items
  - box_photos
  - extraction_jobs
  - item_suggestions
- Keep domain logic in pure TypeScript modules so it can be tested without UI.
- Use Expo and cross-platform APIs by default so iOS can be added later without a UI rewrite.

### 2. Local Box Catalog

- Implement box list, empty state, box creation, and box card.
- Each box gets a stable `id` and a human-readable `number`.
- In the box card, the user can add an item manually and delete an item.
- Implement local search over confirmed items.
- Deleted items must disappear from search results immediately.

Acceptance:

- Android app can create at least 10 boxes.
- User can add and delete items manually.
- Search finds the correct box from manual item data.

### 3. QR Flow

- Generate QR payload from stable `boxId`, not the mutable box number.
- Show the QR code in the box card.
- Scan QR using the camera and open `/qr/[boxId]`.
- If the box does not exist, show a recoverable not-found state.

Acceptance:

- QR opens the correct box.
- Changing a box number does not break the QR.

### 4. Photos Per Box

- One box can have multiple photos.
- Each photo belongs to exactly one box.
- Add photos through camera or gallery picker.
- Compress photos before saving.
- Store local file URI and thumbnail/preview metadata.
- Show photos in the box card.

Acceptance:

- A box can store 2-3 photos.
- Photos survive app restart.
- If camera is unavailable, gallery picker still works.

### 5. Extraction Adapter

- Create backend endpoint `POST /api/extract-items`.
- Introduce shared interface:

```ts
type ExtractionMode = 'mock' | 'local-desktop-vlm' | 'cloud-vlm';

type ExtractItemsRequest = {
  boxId: string;
  photoIds: string[];
  photos?: {
    id: string;
    mimeType: 'image/jpeg';
    dataBase64: string;
    width: number;
    height: number;
    byteSize: number;
  }[];
  mode: ExtractionMode;
};

type ItemSuggestion = {
  id: string;
  name: string;
  attributes?: {
    color?: string;
    category?: string;
    season?: string;
    material?: string;
  };
  sourcePhotoIds: string[];
  reason?: string;
  selectedByDefault: boolean;
};
```

- First adapter: `mock`, for UI and flow development without a model.
- Second adapter: `local-desktop-vlm`, where the app sends compressed JPEG photos
  as base64 payloads to a local backend on the same network.
- Keep `cloud-vlm` as an optional quality benchmark only.
- Validate request and response shapes with Zod.

Acceptance:

- Extraction job can process multiple photos from one box.
- Extraction job must not mix photos from different boxes.
- Model errors do not delete photos and expose retry/manual fallback.

### 6. Suggestion Review

- Add review screen for extraction jobs.
- User can:
  - add all suggestions;
  - add selected suggestions;
  - rename a suggestion;
  - delete a wrong suggestion;
  - add a missing item manually.
- AI suggestions never become confirmed items automatically.
- Applying suggestions is idempotent.

Acceptance:

- Only confirmed items appear in search.
- Re-applying the same suggestions does not create duplicates.

### 7. Evidence Search

- Implement local search scoring:
  - exact phrase;
  - token overlap;
  - aliases;
  - attributes.
- Group results by box.
- Show matched terms and photo evidence from `sourcePhotoIds`.
- Show candidates instead of pretending one result is certainly correct.

Acceptance:

- Query `черные перчатки` shows the candidate box and relevant photo.
- No-results state is clear.
- Multiple weak matches are shown as candidates.

## Test Plan

Unit tests with Vitest:

- create box
- duplicate number validation
- add and delete item
- multiple photos per box
- extraction job rejects photos from different boxes
- add all suggestions
- add selected suggestions
- idempotent suggestion apply
- search exact match
- search attribute match
- no results
- multiple candidates

Android E2E tests with Maestro:

- create first box
- add manual item
- delete item and verify search no longer finds it
- add 2-3 photos to one box
- run mock extraction and add selected suggestions
- QR route opens the correct box
- extraction failure shows retry and manual fallback

AI eval fixture:

- 3 real boxes
- 2-3 photos per box
- expected item list per box
- 5 search queries per box
- success means the correct box appears in top 2 for each query

## Assumptions And Defaults

- Android is the first target.
- iOS is a future target, so avoid Android-only libraries unless isolated behind adapters.
- No accounts, sharing, payments, subscriptions, or cloud sync in MVP.
- On-device phone VLM is deferred.
- First free AI experiment is local-desktop-vlm.
- Backend stores no primary domain data. Mobile SQLite is the source of truth.
- Exact object highlighting on photos is v2.
- Cloud AI is optional benchmark only, not required for MVP.
