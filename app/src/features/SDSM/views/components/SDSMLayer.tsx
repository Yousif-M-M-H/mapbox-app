// app/src/features/SDSM/views/components/SDSMLayer.tsx
import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { SDSMVehicle } from '../../models/SDSMData';
import { SDSMViewModel } from '../../viewmodels/SDSMViewModel';
import { VehicleMarker } from './VehicleMarker';

interface SDSMLayerProps {
  viewModel: SDSMViewModel;
  onVehiclePress?: (vehicle: SDSMVehicle) => void;
}

export const SDSMLayer: React.FC<SDSMLayerProps> = observer(({ 
  viewModel, 
  onVehiclePress 
}) => {
  // Start auto-refresh when component mounts
  React.useEffect(() => {
    viewModel.startAutoRefresh();
    
    // Clean up when component unmounts
    return () => {
      viewModel.cleanup();
    };
  }, [viewModel]);
  
  // If there are no vehicles or we're still loading the first batch, return empty
  if (viewModel.vehicles.length === 0 && !viewModel.lastUpdated) {
    return null;
  }
  
  return (
    <View>
      {viewModel.vehicles.map(vehicle => (
        <VehicleMarker 
          key={`${vehicle._id}-${vehicle.objectID}`}
          vehicle={vehicle}
          onPress={onVehiclePress}
        />
      ))}
    </View>
  );
});