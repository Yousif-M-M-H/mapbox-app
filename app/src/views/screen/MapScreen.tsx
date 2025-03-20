// src/views/screens/MapScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { MapViewModel } from '../../viewModel/MapViewModel';
import { MapViewComponent } from '../components/MapView';
import { LocationButton } from '../components/LocationButton';
import { RouteButton } from '../components/RouteButton';
import { TitleBar } from '../components/TitleBar';
import { RouteInfo } from '../components/RouteInfo';
import { mapStyles } from '../../styles/mapStyles';

export const MapScreen: React.FC = observer(() => {
  // Create and store the ViewModel instance
  const viewModel = React.useMemo(() => new MapViewModel(), []);

  return (
    <View style={mapStyles.container}>
      <MapViewComponent viewModel={viewModel} />
      
      <LocationButton onPress={() => viewModel.getCurrentLocation()} />
      
      <RouteButton onPress={() => viewModel.fetchDirections()} />
      
      <TitleBar />
      
      <RouteInfo viewModel={viewModel} />
    </View>
  );
});