// app/src/features/SDSM/views/components/SDSMLayer.tsx
import React, { useEffect } from 'react';
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
  useEffect(() => {
    console.log("SDSM Layer mounted, starting auto-refresh");
    viewModel.startAutoRefresh();
    
    // Clean up when component unmounts
    return () => {
      console.log("SDSM Layer unmounted, cleaning up");
      viewModel.cleanup();
    };
  }, [viewModel]);
  
  // Log vehicle info for debugging
  useEffect(() => {
    console.log(`Rendering ${viewModel.vehicles.length} vehicles`);
  }, [viewModel.vehicles]);
  
  return (
    <View>
      {viewModel.vehicles.map(vehicle => (
        <VehicleMarker 
          key={`vehicle-${vehicle.objectID}`}
          vehicle={vehicle}
          onPress={onVehiclePress}
        />
      ))}
    </View>
  );
});