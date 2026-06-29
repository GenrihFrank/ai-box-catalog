import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ReviewRoute() {
  const { boxId, jobId } = useLocalSearchParams<{ boxId: string; jobId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review suggestions</Text>
      <Text style={styles.body}>Box ID: {boxId}</Text>
      <Text style={styles.body}>Job ID: {jobId}</Text>
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
