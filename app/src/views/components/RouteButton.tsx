import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { buttonStyles } from '../../styles/commonStyles';

interface RouteButtonProps {
  onPress: () => void;
}

export const RouteButton: React.FC<RouteButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={buttonStyles.routeButton} 
      onPress={onPress}
    >
      <Text style={buttonStyles.buttonText}>🚗</Text>
    </TouchableOpacity>
  );
};