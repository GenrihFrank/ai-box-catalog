import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function QrRoute() {
  const { boxId } = useLocalSearchParams<{ boxId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR route</Text>
      <Text style={styles.body}>QR opened stable box ID: {boxId}</Text>
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
  }
});
