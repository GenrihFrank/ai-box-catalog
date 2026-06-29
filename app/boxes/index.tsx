import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function BoxesRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Boxes</Text>
      <Text style={styles.body}>The local catalog starts here.</Text>
      <Link href="/boxes/new" style={styles.link}>
        Create first box
      </Link>
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
  link: {
    color: '#0b57d0',
    fontSize: 16,
    fontWeight: '600'
  }
});
