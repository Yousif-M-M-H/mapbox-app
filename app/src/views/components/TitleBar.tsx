import React from 'react';
import { View, Text } from 'react-native';
import { mapStyles } from '../../styles/mapStyles';

export const TitleBar: React.FC = () => {
  return (
    <View style={mapStyles.titleContainer}>
      <Text style={mapStyles.title}>Route to University of Tennessee at Chattanooga</Text>
    </View>
  );
};