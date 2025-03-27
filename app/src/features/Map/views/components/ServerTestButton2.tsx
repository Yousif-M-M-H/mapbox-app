// src/features/Map/views/components/ServerTestButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { testServerConnection } from '../../../../core/utils/serverTest';

export const ServerTestButton2: React.FC = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={testServerConnection}
      >
        <Text style={styles.buttonText}>Test Server Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 160, // Positioned below the MongoDB test button
    right: 20,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#3CB371', // Green button to distinguish from MongoDB test
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});