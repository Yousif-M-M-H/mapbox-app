// app/src/features/DriverView/views/components/DriverViewButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { observer } from 'mobx-react-lite';
import { styles } from '../../styles';
import { DriverViewModel } from '../../models/DriverViewModel';

interface DriverViewButtonProps {
  viewModel: DriverViewModel;
  onToggle: (isDriverView: boolean) => void;
}

export const DriverViewButton: React.FC<DriverViewButtonProps> = observer(({ 
  viewModel, 
  onToggle 
}) => {
  const handlePress = () => {
    const isDriverView = viewModel.toggleDriverPerspective();
    onToggle(isDriverView);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, viewModel.isDriverPerspective ? styles.buttonActive : null]}
      onPress={handlePress}
    >
      <Text style={viewModel.isDriverPerspective ? styles.buttonTextActive : styles.buttonText}>
        {viewModel.isDriverPerspective ? 'Exit Driver View' : 'Driver View'}
      </Text>
    </TouchableOpacity>
  );
});