import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.message}>Choremate boot OK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE600',
    padding: 24,
  },
  message: {
    color: '#24105A',
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
});