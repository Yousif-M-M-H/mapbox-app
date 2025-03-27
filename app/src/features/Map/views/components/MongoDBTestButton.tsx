// src/features/Map/views/components/MongoDBTestButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { API_CONFIG } from '../../../../core/api/config';
import { testMongoDBServer } from '../../../../core/utils/debugTool';

export const MongoDBTestButton: React.FC = () => {
  const testConnection = () => {
    console.log('Testing MongoDB connection via button press');
    testMongoDBServer(API_CONFIG.SERVER_URL);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={testConnection}
      >
        <Text style={styles.buttonText}>Test MongoDB Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#4080FF',
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