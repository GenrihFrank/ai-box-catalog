import { StyleSheet, Text, View } from 'react-native';

export default function NewBoxRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New box</Text>
      <Text style={styles.body}>Box creation will be implemented in Phase 1.</Text>
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
