import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { buttonStyles } from '../../styles/commonStyles';

interface LocationButtonProps {
  onPress: () => void;
}

export const LocationButton: React.FC<LocationButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={buttonStyles.locationButton} 
      onPress={onPress}
    >
      <Text style={buttonStyles.buttonText}>📍</Text>
    </TouchableOpacity>
  );
};