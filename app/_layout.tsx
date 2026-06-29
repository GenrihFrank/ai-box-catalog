import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { DATABASE_NAME, migrateDatabase } from '../src/db';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'AI Box Catalog' }} />
        <Stack.Screen name="boxes/index" options={{ title: 'Boxes' }} />
        <Stack.Screen name="boxes/new" options={{ title: 'New box' }} />
        <Stack.Screen name="boxes/[boxId]/index" options={{ title: 'Box' }} />
        <Stack.Screen name="boxes/[boxId]/photos" options={{ title: 'Photos' }} />
        <Stack.Screen name="boxes/[boxId]/review/[jobId]" options={{ title: 'Review' }} />
        <Stack.Screen name="qr/[boxId]" options={{ title: 'QR' }} />
      </Stack>
      <StatusBar style="auto" />
    </SQLiteProvider>
  );
}
