import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function BoxPhotosRoute() {
  const { boxId } = useLocalSearchParams<{ boxId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <Text style={styles.body}>Photo capture for box {boxId} will be implemented after QR.</Text>
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
